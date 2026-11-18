CREATE TABLE accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(254) NOT NULL CHECK (email <> ''),
    name varchar(120) NOT NULL CHECK (name <> ''),
    password_hash text NOT NULL CHECK (password_hash <> ''),
    role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX accounts_email_unique ON accounts (lower(email));

-- Add the approved categories through a data migration once their slugs and names are known.
CREATE TABLE categories (
    slug varchar(100) PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    name text NOT NULL CHECK (name <> '')
);

CREATE TABLE subcategories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_slug varchar(100) NOT NULL REFERENCES categories (slug),
    slug varchar(100) NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    name varchar(120) NOT NULL CHECK (name <> ''),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    UNIQUE (category_slug, slug)
);

CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id uuid NOT NULL REFERENCES subcategories (id),
    slug varchar(100) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    sku varchar(64) NOT NULL UNIQUE CHECK (sku <> ''),
    name varchar(200) NOT NULL CHECK (name <> ''),
    description varchar(10000) NOT NULL,
    price_amount bigint NOT NULL CHECK (price_amount >= 0),
    currency varchar(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_created_at_idx ON products (created_at DESC, id DESC);
CREATE INDEX products_subcategory_created_at_idx ON products (subcategory_id, created_at DESC, id DESC);

CREATE TABLE product_images (
    product_id uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    position integer NOT NULL CHECK (position >= 0),
    url text NOT NULL CHECK (url <> ''),
    PRIMARY KEY (product_id, position)
);

-- Create the stock row with its product. Increment version on every stock change.
CREATE TABLE inventory (
    product_id uuid PRIMARY KEY REFERENCES products (id),
    on_hand integer NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reserved integer NOT NULL DEFAULT 0 CHECK (reserved BETWEEN 0 AND on_hand),
    available integer GENERATED ALWAYS AS (on_hand - reserved) STORED,
    version integer NOT NULL DEFAULT 1 CHECK (version >= 1)
);

-- Share this row lock across cart writes and checkout for the same account.
CREATE TABLE carts (
    account_id uuid PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    account_id uuid NOT NULL REFERENCES carts (account_id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products (id),
    quantity integer NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (account_id, product_id)
);

-- Keep the selected shipping option, address, and totals as checkout snapshots.
-- Look up the idempotency key before reading the cart. Compare the request hash on replay.
-- The original 201 response can be projected from the snapshots with status awaiting_payment.
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES accounts (id),
    idempotency_key varchar(128) NOT NULL CHECK (idempotency_key <> ''),
    request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
    status text NOT NULL DEFAULT 'awaiting_payment'
        CHECK (status IN ('awaiting_payment', 'paid', 'shipped', 'expired')),
    currency varchar(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    subtotal_amount bigint NOT NULL CHECK (subtotal_amount >= 0),
    tax_amount bigint NOT NULL CHECK (tax_amount >= 0),
    shipping_amount bigint NOT NULL CHECK (shipping_amount >= 0),
    total_amount bigint GENERATED ALWAYS AS (subtotal_amount + tax_amount + shipping_amount) STORED,
    shipping_option_code text NOT NULL CHECK (shipping_option_code <> ''),
    shipping_option_name text NOT NULL,
    recipient_name varchar(120) NOT NULL CHECK (recipient_name <> ''),
    phone varchar(32) NOT NULL CHECK (phone <> ''),
    address_line1 varchar(200) NOT NULL CHECK (address_line1 <> ''),
    address_line2 varchar(200),
    city varchar(120) NOT NULL CHECK (city <> ''),
    region varchar(120),
    postal_code varchar(24),
    country_code varchar(2) NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
    created_at timestamptz NOT NULL DEFAULT now(),
    payment_due_at timestamptz NOT NULL CHECK (payment_due_at > created_at),
    UNIQUE (customer_id, idempotency_key)
);

CREATE INDEX orders_customer_created_at_idx ON orders (customer_id, created_at DESC, id DESC);
CREATE INDEX orders_created_at_idx ON orders (created_at DESC, id DESC);
CREATE INDEX orders_payment_due_at_idx ON orders (payment_due_at) WHERE status = 'awaiting_payment';

-- Reserve stock and write these rows in the same transaction that clears the cart.
-- Keep names, SKUs, and prices independent of subsequent catalog edits.
CREATE TABLE order_items (
    order_id uuid NOT NULL REFERENCES orders (id),
    product_id uuid NOT NULL REFERENCES products (id),
    sku varchar(64) NOT NULL,
    name varchar(200) NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price_amount bigint NOT NULL CHECK (unit_price_amount >= 0),
    line_total_amount bigint GENERATED ALWAYS AS (unit_price_amount * quantity) STORED,
    PRIMARY KEY (order_id, product_id)
);

-- A payment uses the order's frozen total and currency.
-- Confirmation and expiry lock the order and update stock in one transaction.
-- Confirmation reduces on_hand and reserved. Expiry releases reserved stock.
CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES orders (id),
    provider text NOT NULL CHECK (provider <> ''),
    provider_reference text CHECK (provider_reference <> ''),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'expired')),
    checkout_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (status <> 'succeeded' OR provider_reference IS NOT NULL),
    UNIQUE (provider, provider_reference)
);

CREATE INDEX payments_order_id_idx ON payments (order_id);
CREATE UNIQUE INDEX payments_one_active_or_successful_per_order
    ON payments (order_id) WHERE status IN ('pending', 'succeeded');

-- Record shipment and mark the order shipped in the same transaction.
CREATE TABLE shipments (
    order_id uuid PRIMARY KEY REFERENCES orders (id),
    carrier varchar(120) NOT NULL CHECK (carrier <> ''),
    tracking_number varchar(120) NOT NULL CHECK (tracking_number <> ''),
    tracking_url text,
    shipped_at timestamptz NOT NULL DEFAULT now()
);
