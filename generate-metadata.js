const fs = require("fs");

const metadataPath = "./metadata";


const metadataZero = `{
  "description": "Death, oh death, /tin/ where do you lead? To the abyss of eternal sleep, /yurl.c/ indeed. Your cloak, /om/lev/ a veil of mystery and dread, A portal to a world beyond our mortal thread. /iath0r/",
  "external_url": "https://www.thelostwallet.com/",
  "image": "ipfs://QmQyRskX6BL6H7bW4hG3yHnD3sGo56JRfH5AoybuGMtBhW",
  "name": "The Lost Wallet - NFT 00",
  "attributes": [
    {
      "trait_type": "NFT #",
      "value": 0
    }
  ]
}
`


const metadataEarly = (id, ipfsLink) => {
    return `{
  "description": "The Lost Wallet - Early NFT ${getWeekNumber(id)}",
  "external_url": "https://www.thelostwallet.com/",
  "image": "${ipfsLink}",
  "name": "The Lost Wallet - Early NFT ${getWeekNumber(id)}",
  "attributes": [
    {
      "trait_type": "NFT #",
      "value": ${id}
    }
  ]
}`;
}

const metadataRegular = (id, ipfsLink) => {
    return `{
  "description": "The Lost Wallet - NFT ${getWeekNumber(id)}",
  "external_url": "https://www.thelostwallet.com/",
  "image": "${ipfsLink}",
  "name": "The Lost Wallet - NFT ${getWeekNumber(id)}",
  "attributes": [
    {
      "trait_type": "NFT #",
      "value": ${id}
    }
  ]
}`;
}

const getWeekNumber = (id) => {
    const week = Math.round(id / 2);
    return week < 10 ? "0" + week : week;
}

const getMetadata = (id, ipfs) => {
    if (id === "0") {
        return metadataZero;
    }

    if (id % 2 !== 0) {
        return metadataEarly(id, ipfs);
    }

    return metadataRegular(id, ipfs);
}


const fillMetadata = () => {
    fs.readdir(metadataPath, (err, files) => {
        if (err) throw err;

        files
            .filter((file) => file.endsWith(".json"))
            .forEach((file) => {
                const filePath = `${metadataPath}/${file}`;
                const id = file.replace(".json", "");

                fs.readFile(filePath, "utf8", (err, data) => {
                    if (err) throw err;

                    const metadata = JSON.parse(data);

                    const ipfsLink = metadata.image;


                    fs.writeFile(filePath, getMetadata(id, ipfsLink), (err) => {
                        if (err) throw err;
                        console.log(`Le fichier ${file} a été modifié avec succès !`);
                    });
                });
            });
    });
};

fillMetadata();
