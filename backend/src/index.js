"use strict";
module.exports = {
  register({ strapi }) {
    // Force the socket to be treated as encrypted for proxy setups
    strapi.server.use(async (ctx, next) => {
      if (ctx.req?.socket) {
        ctx.req.socket.encrypted = true;
      }
      await next();
    });
  },

  bootstrap() {},
};
