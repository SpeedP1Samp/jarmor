const express = require("express");
const router = express.Router();
const { getKeys, updateKeys } = require("../github");
const { randomBytes } = require("crypto");

router.get("/", async (req, res) => {
  try {
    const { userdiscord, duration } = req.query;
    if (!userdiscord || userdiscord.trim() === "") {
      return res.status(400).json({ error: "Parâmetro 'userdiscord' inválido" });
    }
    const durationInt = parseInt(duration);
    if (isNaN(durationInt) || durationInt <= 0) {
      return res.status(400).json({ error: "Parâmetro 'duration' inválido" });
    }

    const key = randomBytes(4).toString("hex").toUpperCase();
    const created_at = Math.floor(Date.now() / 1000);

    const { keys, sha } = await getKeys();

    keys.push({
      key,
      hwid: null,
      created_at,
      duration: durationInt,
      userdiscord
    });

    await updateKeys(keys, sha, `Create key ${key} for ${userdiscord}`);

    res.json({
      Key: key,
      Hwid: null,
      Temp: durationInt,
      Userdiscord: userdiscord
    });
  } catch (err) {
    console.error("Erro createkey:", err.message);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;
