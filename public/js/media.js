function getUploadedMediaUrl(media, folder) {
    if (typeof media !== "string" || !media) {
        return "";
    }

    if (/^https:\/\/res\.cloudinary\.com\//i.test(media)) {
        return media;
    }

    return `/uploads/${folder}/${encodeURIComponent(media)}`;
}

const DEFAULT_PROFILE_IMAGE = "/images/default-avatar.svg";

function getProfileImageUrl(profileImage) {
    return typeof profileImage === "string" && profileImage
        ? getUploadedMediaUrl(profileImage, "profiles")
        : DEFAULT_PROFILE_IMAGE;
}

function setProfileImageSource(image, profileImage) {
    image.onerror = () => {
        image.onerror = null;
        image.src = DEFAULT_PROFILE_IMAGE;
    };
    image.src = getProfileImageUrl(profileImage);
}
