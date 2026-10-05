ALTER TABLE notifications
    ADD COLUMN related_comment_id INT UNSIGNED DEFAULT NULL AFTER related_id,
    ADD INDEX idx_notifications_related_comment (related_comment_id),
    ADD CONSTRAINT fk_notification_comment
        FOREIGN KEY (related_comment_id)
        REFERENCES comments(id)
        ON DELETE SET NULL;
