INSERT INTO categories (slug, name) VALUES ('catalog-test', 'Catalog Test'), ('empty-test', 'Empty Test');
INSERT INTO subcategories (id, category_slug, slug, name, status) VALUES
('525a24fe-ae23-46b2-a286-4604b40abfb2', 'catalog-test', 'active-test', 'Active Test', 'active'),
('e30a7069-711e-4f96-a1ed-e7b2cd05a066', 'catalog-test', 'archived-test', 'Archived Test', 'archived');
INSERT INTO products (subcategory_id, slug, sku, name, description, price_amount, currency, status, created_at) VALUES
('525a24fe-ae23-46b2-a286-4604b40abfb2', 'first', 'SKU-FIRST', 'First', 'First description', 1234, 'USD', 'published', now()),
('525a24fe-ae23-46b2-a286-4604b40abfb2', 'second', 'SKU-SECOND', 'Second', '', 9223372036854775807, 'USD', 'published', now() - interval '1 minute'),
('525a24fe-ae23-46b2-a286-4604b40abfb2', 'draft', 'SKU-DRAFT', 'Draft', '', 10, 'USD', 'draft', now()),
('e30a7069-711e-4f96-a1ed-e7b2cd05a066', 'hidden', 'SKU-HIDDEN', 'Hidden', '', 10, 'USD', 'published', now());
INSERT INTO product_images (product_id, position, url)
SELECT id, position, url FROM products
CROSS JOIN (VALUES (1, 'https://example.test/b'), (0, 'https://example.test/a')) AS images(position, url)
WHERE slug = 'first';
