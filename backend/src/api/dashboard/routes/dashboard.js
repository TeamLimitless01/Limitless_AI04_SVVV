module.exports = {
  routes: [
    {
      method: "GET",
      path: "/dashboard/:userId",
      handler: "dashboard.getDashboardData",
      config: {
        auth: false, // change to true if you want only logged-in users
      },
    },
  ],
};
