CREATE TABLE IF NOT EXISTS story_likes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    story_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_story_like (story_id, user_id),

    CONSTRAINT fk_story_like_story
        FOREIGN KEY (story_id)
        REFERENCES stories(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_story_like_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
