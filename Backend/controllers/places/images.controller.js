import { createApi } from "unsplash-js";

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
});

export const getHeroImageFromApi = async (place) => {
  try {
    const result = await unsplash.photos.getRandom({
      query: `Best tourist spot of ${place}`,
      count: 1,
      orientation: "landscape",
    });
    if (result.errors) {
      console.log("Error in Hero Image: ", result.errors[0]);
    } else {
      const photo = result.response[0];
      const fullImage = `${photo.urls.raw}?q=80&w=1920&auto=format&fit=crop`;
      return fullImage;
    }
  } catch (err) {
    console.log("Error in getting Hero Image: ", err);
  }
};

export const getImagesFromApi = async (place) => {
  try {
    const result = await unsplash.search.getPhotos({
      query: `Tourist Attractions of ${place}`,
      orderBy: "relevant",
      perPage: 30,
    });
    return result;
  } catch (err) {
    console.log("Error in Calling Images API: ", err);
  }
};
