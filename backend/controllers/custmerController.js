const custmer = require("../models/Custmer");
const getCustmer = async (req, res) => {
  try {
    const cust = await custmer.find();
    res.status(200).json(cust);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

const deleteCustmer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await custmer.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { getCustmer, deleteCustmer };
