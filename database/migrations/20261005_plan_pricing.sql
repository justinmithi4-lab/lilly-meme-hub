UPDATE plans
SET
    name = CASE
        WHEN LOWER(name) IN ('3 months', 'three months', 'quarterly')
            THEN '3 Months'
        ELSE name
    END,
    description = CASE
        WHEN LOWER(name) = 'weekly'
            THEN 'Access Lilly Memes for seven days.'
        WHEN LOWER(name) = 'monthly'
            THEN 'Access Lilly Memes for thirty days.'
        ELSE 'Access Lilly Memes for ninety days.'
    END,
    price = CASE
        WHEN LOWER(name) = 'weekly' THEN 200.00
        WHEN LOWER(name) = 'monthly' THEN 1000.00
        ELSE 2000.00
    END,
    currency = 'MWK',
    duration_days = CASE
        WHEN LOWER(name) IN ('3 months', 'three months', 'quarterly')
            THEN 90
        ELSE duration_days
    END
WHERE LOWER(name) IN (
    'weekly',
    'monthly',
    '3 months',
    'three months',
    'quarterly'
)
OR duration_days = 90;
