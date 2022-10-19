module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  testPathIgnorePatterns: ["dist"],
};
