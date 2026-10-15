ALTER TABLE payments
    MODIFY payment_method ENUM(
        'airtel_money',
        'tnm_mpamba',
        'malipo',
        'bank',
        'cash',
        'manual',
        'paychangu'
    ) NOT NULL,
    ADD COLUMN checkout_url VARCHAR(2048) NULL;
