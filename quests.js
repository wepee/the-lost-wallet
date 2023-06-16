const goerliID = 5;
const mainnetID = 1;
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const EvmChains = window.EvmChains;
const Fortmatic = window.Fortmatic;

const displayedQuests = 9 // including 0

let web3Modal, provider, selectedAccount;
let accounts = [];
let weekId = 0;

let currOwned = null;
let currMint = null;

let web3 = null;
let nftContract = null;

function init() {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                infuraId: "27e484dcd9e3efcfd25a83a78777cdf1",
            }
        },
        fortmatic: {
            package: Fortmatic
        }
    };

    web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions,
    });

}

async function fetchAccountData() {
    web3 = new Web3(provider);
    nftContract = new web3.eth.Contract(CONTRACT_ABI, DEBUG ? CONTRACT_ADDR_TEST : CONTRACT_ADDR);
    const chainId = await web3.eth.getChainId();

    if (DEBUG && chainId !== goerliID) {
        alert("To debug you must be on goerli...");
        return;
    } else if (!DEBUG && chainId !== mainnetID) {
        alert("You must be on main net...");
        return;
    }
    accounts = await web3.eth.getAccounts();
    selectedAccount = accounts[0];
    var cutAcc = selectedAccount.replace(selectedAccount.substring(4, selectedAccount.length - 4), "...");

    // Go through all accounts and get their ETH balance
    const rowResolvers = accounts.map(async (address) => {
        const balance = await web3.eth.getBalance(address);
        const ethBalance = web3.utils.fromWei(balance, "ether");
        const parseBalance = parseFloat(ethBalance).toFixed(3);

        //document.querySelector(".address").textContent = address;
        //document.querySelector(".balance").textContent = parseBalance;
    });
    await Promise.all(rowResolvers);
    $("a:contains('connect')").addClass("connect-display-addr");
    $("a:contains('connect')").text("disconnect " + cutAcc);
}

async function refreshAccountData() {
    $("a:contains('connect')").attr("disabled", "disabled");
    await fetchAccountData(provider);
    $("a:contains('connect')").removeAttr("disabled");
}

async function onConnect() {
    try {
        provider = await web3Modal.connect();
    } catch (e) {
        console.log("Could not get a wallet connection", e);
        return;
    }
    provider.on("accountsChanged", (accounts) => {
        fetchAccountData();
    });
    provider.on("chainChanged", (chainId) => {
        fetchAccountData();
    });
    provider.on("networkChanged", (networkId) => {
        fetchAccountData();
    });
    await refreshAccountData();
    checkOwned();
}

async function onDisconnect() {
    if (provider.close) {
        await provider.close();
        await web3Modal.clearCachedProvider();
        provider = null;
    }
    selectedAccount = null;
    $("a:contains('connect')").text("connect");
    $("a:contains('connect')").removeClass("connect-display-addr");
}

const checkOwned = async () => {
    if (selectedAccount && currOwned && currMint) {
        if (weekId > 0) {
            if (await nftContract.methods.balanceOf(selectedAccount, (weekId * 2) - 1).call() !== "0" || await nftContract.methods.balanceOf(selectedAccount, weekId * 2).call() !== "0") {
                currOwned.classList.add("show-owned");
                currMint.classList.add("green-disabled");
            } else {
                currOwned.classList.remove("show-owned");
                currMint.classList.remove("green-disabled");
            }
        } else if (weekId === 0) {
            if (await nftContract.methods.balanceOf(selectedAccount, weekId).call() !== "0") {
                currOwned.classList.add("show-owned");
                currMint.classList.add("green-disabled");
            } else {
                currOwned.classList.remove("show-owned");
                currMint.classList.remove("green-disabled");
            }
        }
    }
    hideMintBtn();
}

const hideMintBtn = () => {
    if (weekId <= LAST_ACTIVATED_WEEK_ID) {
        currMint.classList.remove("green-disabled");
    } else {
        currMint.classList.add("green-disabled");
    }
}

const loadQuest = async (target) => {
    let isQuestZero = false;

    try {
        if (target.childNodes[0].childNodes[6].childNodes[0].childNodes[1].innerText.split("QUEST #")[1] !== "00") {
            isQuestZero = false;
        }
    } catch (error) {
        isQuestZero = true;
    }

    const quest = target.childNodes[0].childNodes[isQuestZero ? 2 : displayedQuests].childNodes[0].childNodes[1].innerText.split("QUEST #")[1];
    const owned = target.childNodes[0].childNodes[isQuestZero ? 2 : displayedQuests].childNodes[2].childNodes[2].childNodes[0];
    const connect = target.childNodes[0].childNodes[isQuestZero ? 2 : displayedQuests].childNodes[2].childNodes[2].childNodes[1];
    const mint = target.childNodes[0].childNodes[isQuestZero ? 2 : displayedQuests].childNodes[2].childNodes[2].childNodes[2];

    owned.setAttribute("disabled", "disabled");
    owned.style.pointerEvents = "none";
    currOwned = owned;
    currMint = mint;
    currConnect = connect;
    console.log("Loading quest " + quest);
    if (quest.length === 2 && quest[0] === "0") {
        weekId = parseInt(quest.substring(1));
    } else {
        weekId = parseInt(quest);
    }
    console.log("For week " + weekId);

    checkOwned();
}

const fetchWlSignature = async (address) => {
    const options = {method: "GET"};
    const url = API_URL + CHECK_SIGN_ROUTE + weekId.toString() + "/" + address;
    const response = await (await fetch(url, options)).json();

    if (!response["signature"]) {
        throw new Error("You are not on the Whitelist for week ID: " + weekId.toString());
    }
    return response["signature"];
}

const mint = async (signature) => {
    return await nftContract.methods.mint(weekId, signature.v, signature.r, signature.s).send({from: selectedAccount});
}

const checkIfConnected = async () => {
    const accounts = await ethereum.request({method: "eth_accounts"});

    if (accounts.length) {
        selectedAccount = accounts[0];
        const cutAcc = selectedAccount.replace(selectedAccount.substring(4, selectedAccount.length - 4), "...");
        $("a:contains('connect')").addClass("connect-display-addr");
        $("a:contains('connect')").text("disconnect " + cutAcc);
    }
}

window.addEventListener("load", async () => {
    console.log("load OK");

    $(".popup-buttons a").on("click", (e) => {
        e.preventDefault();
    });

    await init();
    //await checkIfConnected();

    $(".loading-progress-screen").removeClass("show");
    $(".loading-progress-screen").addClass("hide");

    $("a:contains('connect')").on("click", async () => {
        if (selectedAccount) {
            onDisconnect();
        } else {
            onConnect();
        }
    });

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutationRecord) => {
            try {
                loadQuest(mutationRecord.target);
            } catch (error) {
                console.log(JSON.stringify(error));
                alert(error['message']);
            }
        });
    });
    const targets = [...document.querySelectorAll(".popup-details"), ...document.querySelectorAll(".popup-details00")];

    for (const target of targets) {
        observer.observe(target, {attributes: true, attributeFilter: ["style"]});
    }

    $("a:contains('mint nft')").on("click", async function () {
        if (!selectedAccount) {
            alert("You need to connect first!");
        } else {
            try {
                $(this).attr("disabled", "disabled");
                $(this).text("minting...");
                const signature = await fetchWlSignature(selectedAccount);
                const tx = await mint(signature);
                $(this).removeAttr("disabled");
                $(this).text("minting done");
                currOwned.classList.add("show-owned");
            } catch (error) {
                $(this).text("mint nft");
                console.log(JSON.stringify(error));
                alert(error['message']);
            }
        }
    });

});
