-- ============================================================
-- LILLY MEMES DATABASE
-- ============================================================

USE lilly_memes;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    full_name VARCHAR(100),

    profile_image VARCHAR(255),

    role ENUM('member', 'admin') NOT NULL DEFAULT 'member',

    status ENUM('active', 'suspended', 'pending') NOT NULL DEFAULT 'active',

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. MEMBERSHIP PLANS
-- ============================================================

CREATE TABLE plans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    description TEXT,

    price DECIMAL(10,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'MWK',

    duration_days INT UNSIGNED NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. SUBSCRIPTIONS
-- ============================================================

CREATE TABLE subscriptions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    plan_id INT UNSIGNED NOT NULL,

    start_date DATETIME,

    end_date DATETIME,

    status ENUM(
        'pending',
        'active',
        'expired',
        'cancelled',
        'rejected'
    ) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_subscription_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_subscription_plan
        FOREIGN KEY (plan_id)
        REFERENCES plans(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 4. PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    subscription_id INT UNSIGNED,

    amount DECIMAL(10,2) NOT NULL,

    currency VARCHAR(10) NOT NULL DEFAULT 'MWK',

    payment_method ENUM(
        'airtel_money',
        'tnm_mpamba',
        'malipo',
        'bank',
        'cash',
        'manual'
    ) NOT NULL,

    transaction_reference VARCHAR(150),

    phone_number VARCHAR(30),

    status ENUM(
        'pending',
        'successful',
        'failed',
        'rejected',
        'refunded'
    ) NOT NULL DEFAULT 'pending',

    verified_by INT UNSIGNED,

    verified_at DATETIME,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_payment_verified_by
        FOREIGN KEY (verified_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 5. MEME CATEGORIES
-- ============================================================

CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    image VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 6. MEMES
-- ============================================================

CREATE TABLE memes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    title VARCHAR(200),

    caption VARCHAR(500),

    image VARCHAR(2048) NOT NULL,

    cloudinary_public_id VARCHAR(255),

    view_count INT UNSIGNED NOT NULL DEFAULT 0,

    download_count INT UNSIGNED NOT NULL DEFAULT 0,

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_meme_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 7. MEME / CATEGORY RELATIONSHIP
-- ============================================================

CREATE TABLE meme_categories (
    meme_id INT UNSIGNED NOT NULL,

    category_id INT UNSIGNED NOT NULL,

    PRIMARY KEY (meme_id, category_id),

    CONSTRAINT fk_meme_category_meme
        FOREIGN KEY (meme_id)
        REFERENCES memes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_meme_category_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 8. LIKES
-- ============================================================

CREATE TABLE likes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    meme_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_meme_like (user_id, meme_id),

    CONSTRAINT fk_like_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_like_meme
        FOREIGN KEY (meme_id)
        REFERENCES memes(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 9. COMMENTS
-- ============================================================

CREATE TABLE comments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    meme_id INT UNSIGNED NOT NULL,

    parent_id INT UNSIGNED DEFAULT NULL,

    comment_text VARCHAR(500) NOT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comment_meme
        FOREIGN KEY (meme_id)
        REFERENCES memes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_comment_parent
        FOREIGN KEY (parent_id)
        REFERENCES comments(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 10. DOWNLOADS
-- ============================================================

CREATE TABLE downloads (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    meme_id INT UNSIGNED NOT NULL,

    downloaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_download_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_download_meme
        FOREIGN KEY (meme_id)
        REFERENCES memes(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 11. SAVED MEMES
-- ============================================================

CREATE TABLE saved_memes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    meme_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_saved_meme (user_id, meme_id),

    CONSTRAINT fk_saved_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_saved_meme
        FOREIGN KEY (meme_id)
        REFERENCES memes(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 12. MEME VIEWS
-- ============================================================

CREATE TABLE meme_views (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED,

    meme_id INT UNSIGNED NOT NULL,

    ip_address VARCHAR(45),

    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_view_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_view_meme
        FOREIGN KEY (meme_id)
        REFERENCES memes(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 13. STORIES
-- ============================================================

CREATE TABLE stories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    media_type ENUM('image', 'video') NOT NULL DEFAULT 'image',

    media VARCHAR(2048) NOT NULL,

    cloudinary_public_id VARCHAR(255),

    caption VARCHAR(500),

    expires_at DATETIME NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_story_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 14. STORY VIEWS
-- ============================================================

CREATE TABLE story_views (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    story_id INT UNSIGNED NOT NULL,

    user_id INT UNSIGNED NOT NULL,

    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_story_viewer (story_id, user_id),

    CONSTRAINT fk_story_view_story
        FOREIGN KEY (story_id)
        REFERENCES stories(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_story_view_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 15. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    type VARCHAR(50) NOT NULL,

    title VARCHAR(150) NOT NULL,

    message VARCHAR(500),

    related_id INT UNSIGNED,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 16. REPORTS
-- ============================================================

CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    report_type ENUM(
        'meme',
        'comment',
        'user',
        'story'
    ) NOT NULL,

    target_id INT UNSIGNED NOT NULL,

    reason VARCHAR(500) NOT NULL,

    status ENUM(
        'pending',
        'reviewed',
        'resolved',
        'dismissed'
    ) NOT NULL DEFAULT 'pending',

    reviewed_by INT UNSIGNED,

    reviewed_at DATETIME,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_report_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- 17. MEMBER MESSAGES TO ADMIN
-- ============================================================

CREATE TABLE member_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    subject VARCHAR(120) NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_member_messages_created_at (created_at),

    CONSTRAINT fk_member_message_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 18. ADMIN ACTIVITY LOG
-- ============================================================

CREATE TABLE admin_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admin_id INT UNSIGNED NOT NULL,

    action VARCHAR(150) NOT NULL,

    description TEXT,

    ip_address VARCHAR(45),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_log_user
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- 19. SITE SETTINGS
-- ============================================================

CREATE TABLE site_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    setting_key VARCHAR(100) NOT NULL UNIQUE,

    setting_value TEXT,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- DEFAULT MEMBERSHIP PLANS
-- ============================================================

INSERT INTO plans
    (name, description, price, currency, duration_days)
VALUES
    (
        'Weekly',
        'Access Lilly Memes for seven days.',
        200.00,
        'MWK',
        7
    ),
    (
        'Monthly',
        'Access Lilly Memes for thirty days.',
        1000.00,
        'MWK',
        30
    ),
    (
        '3 Months',
        'Access Lilly Memes for ninety days.',
        2000.00,
        'MWK',
        90
    );


-- ============================================================
-- DEFAULT CATEGORIES
-- ============================================================

INSERT INTO categories
    (name, description)
VALUES
    ('Funny', 'Funny and hilarious memes'),
    ('Relationships', 'Relationship and dating memes'),
    ('School', 'School and university memes'),
    ('Malawi', 'Malawian memes'),
    ('Sports', 'Sports related memes'),
    ('Entertainment', 'Entertainment and celebrity memes'),
    ('Work', 'Work and workplace memes'),
    ('Trending', 'Currently trending memes'),
    ('Random', 'Random memes');


-- ============================================================
-- DEFAULT SITE SETTINGS
-- ============================================================

INSERT INTO site_settings
    (setting_key, setting_value)
VALUES
    ('site_name', 'Lilly Memes'),
    ('site_description', 'Your Daily Dose of Memes'),
    ('story_duration_hours', '24'),
    ('max_comment_length', '500'),
    ('max_meme_file_size_mb', '10');