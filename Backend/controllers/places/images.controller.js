import { createApi } from "unsplash-js";

let unsplashInstance = null;
const getUnsplash = () => {
  if (!unsplashInstance) {
    unsplashInstance = createApi({
      accessKey: process.env.UNSPLASH_ACCESS_KEY,
    });
  }
  return unsplashInstance;
};

export const getHeroImageFromApi = async (place) => {
  try {
    const result = await getUnsplash().photos.getRandom({
      query: `Best tourist spot of ${place}`,
      count: 1,
      orientation: "landscape",
    });
    if (result.errors) {
      console.log("Error in Hero Image: ", result.errors[0]);
      return "";
    } else {
      const photo = Array.isArray(result.response) ? result.response[0] : result.response;
      if (!photo || !photo.urls || !photo.urls.raw) {
        console.log("No valid photo returned from Unsplash API");
        return "";
      }
      const fullImage = `${photo.urls.raw}?q=80&w=1920&auto=format&fit=crop`;
      return fullImage;
    }
  } catch (err) {
    console.log("Error in getting Hero Image: ", err);
    return "";
  }
};

export const getImagesFromApi = async (place) => {
  try {
    const result = await getUnsplash().search.getPhotos({
      query: `Tourist Attractions of ${place}`,
      orderBy: "relevant",
      perPage: 30,
    });
    return result;
  } catch (err) {
    console.log("Error in Calling Images API: ", err);
  }
};
