function getUploadedMediaUrl(media, folder) {
    if (typeof media !== "string" || !media) {
        return "";
    }

    if (/^https:\/\/res\.cloudinary\.com\//i.test(media)) {
        return media;
    }

    return `/uploads/${folder}/${encodeURIComponent(media)}`;
}
