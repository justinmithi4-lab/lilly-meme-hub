INSERT INTO plans
    (name, description, price, currency, duration_days)
SELECT
    '3 Months',
    'Access Lilly Memes for ninety days.',
    2000.00,
    'MWK',
    90
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1
    FROM plans
    WHERE LOWER(name) IN ('3 months', 'three months', 'quarterly')
       OR duration_days = 90
);
