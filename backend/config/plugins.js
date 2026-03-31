module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "@strapi/provider-upload-cloudinary",
      providerOptions: {
        cloud_name: env("CLOUDINARY_NAME"),
        api_key: env("CLOUDINARY_KEY"),
        api_secret: env("CLOUDINARY_SECRET"),
      },
      actionOptions: {
        upload: {
          folder: "your-folder-name", // optional
          resource_type: "auto",
        },
        delete: {},
      },
      // disable ALL local optimizations / thumbnails
      breakpoints: {}, // no thumbnails
      sizeOptimization: false, // don't use sharp at all
    },
  },
});
