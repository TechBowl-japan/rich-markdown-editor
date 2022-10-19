module.exports = {
  core: {
    builder: "webpack5",
  },
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    {
      name: "storybook-addon-swc",
      options: {
        enable: true,
        enableSwcLoader: true,
        enableSwcMinify: true,
      },
    },
  ],
  reactOptions: {
    fastRefresh: true,
    strictMode: true,
  },
};
