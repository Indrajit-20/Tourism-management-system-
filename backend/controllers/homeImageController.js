const fs = require("fs");
const path = require("path");

const HOME_IMAGE_DIR = path.join(__dirname, "..", "uploads", "homeimage");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const getHomeImages = async (req, res) => {
  try {
    const files = await fs.promises.readdir(HOME_IMAGE_DIR);

    const images = files
      .filter((fileName) => IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((fileName) => ({
        file_name: fileName,
        image_url: `/uploads/homeimage/${fileName}`,
      }));

    return res.status(200).json(images);
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(200).json([]);
    }

    return res.status(500).json({
      message: "Error fetching home images",
      error: error.message,
    });
  }
};

module.exports = { getHomeImages };
