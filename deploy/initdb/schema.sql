--
-- PostgreSQL database dump
--

\restrict Fp1379RjCbI9vMsht7hU9ezj9TJkpmfcokUztA3h4YfbcQo7A3LEI3KC1hph6Iz

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-11-11 11:40:25

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 913 (class 1247 OID 49275)
-- Name: enum_notifications_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_notifications_type AS ENUM (
    'order',
    'promo',
    'system'
);


--
-- TOC entry 925 (class 1247 OID 74240)
-- Name: enum_orders_delivery_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_orders_delivery_method AS ENUM (
    'delivery',
    'pickup'
);


--
-- TOC entry 901 (class 1247 OID 41019)
-- Name: enum_orders_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_orders_status AS ENUM (
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);


--
-- TOC entry 883 (class 1247 OID 24578)
-- Name: enum_products_gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_products_gender AS ENUM (
    'Male',
    'Female',
    'Unisex'
);


--
-- TOC entry 946 (class 1247 OID 91071)
-- Name: enum_system_logs_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_system_logs_level AS ENUM (
    'info',
    'warning',
    'error'
);


--
-- TOC entry 922 (class 1247 OID 74152)
-- Name: enum_users_gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_gender AS ENUM (
    'Male',
    'Female',
    'Other'
);


--
-- TOC entry 919 (class 1247 OID 49318)
-- Name: enum_users_pref_gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_pref_gender AS ENUM (
    'Male',
    'Female',
    'Unisex'
);


--
-- TOC entry 889 (class 1247 OID 32786)
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_users_role AS ENUM (
    'customer',
    'admin',
    'sysadmin'
);


--
-- TOC entry 934 (class 1247 OID 74370)
-- Name: enum_vouchers_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_vouchers_type AS ENUM (
    'percentage',
    'fixed'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 238 (class 1259 OID 74345)
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    address_id integer NOT NULL,
    user_id integer NOT NULL,
    label character varying(50) DEFAULT 'Rumah'::character varying,
    recipient_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    province character varying(100) NOT NULL,
    province_id character varying(10),
    city character varying(100) NOT NULL,
    city_id character varying(10),
    district character varying(100),
    postal_code character varying(10),
    detail text NOT NULL,
    is_default boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 74344)
-- Name: addresses_address_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.addresses_address_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 237
-- Name: addresses_address_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.addresses_address_id_seq OWNED BY public.addresses.address_id;


--
-- TOC entry 226 (class 1259 OID 32860)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    cart_item_id integer NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    size_ml integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    price integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 32859)
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_items_cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 225
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_items_cart_item_id_seq OWNED BY public.cart_items.cart_item_id;


--
-- TOC entry 224 (class 1259 OID 32844)
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    cart_id integer NOT NULL,
    user_id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 32843)
-- Name: carts_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.carts_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 223
-- Name: carts_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.carts_cart_id_seq OWNED BY public.carts.cart_id;


--
-- TOC entry 250 (class 1259 OID 189359)
-- Name: couriers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.couriers (
    courier_id integer NOT NULL,
    code character varying(30) NOT NULL,
    name character varying(60) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 249 (class 1259 OID 189358)
-- Name: couriers_courier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.couriers_courier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 249
-- Name: couriers_courier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.couriers_courier_id_seq OWNED BY public.couriers.courier_id;


--
-- TOC entry 236 (class 1259 OID 74323)
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    favorite_id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 235 (class 1259 OID 74322)
-- Name: favorites_favorite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favorites_favorite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 235
-- Name: favorites_favorite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favorites_favorite_id_seq OWNED BY public.favorites.favorite_id;


--
-- TOC entry 234 (class 1259 OID 49282)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    type public.enum_notifications_type DEFAULT 'system'::public.enum_notifications_type,
    is_read boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    link character varying(255)
);


--
-- TOC entry 233 (class 1259 OID 49281)
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 233
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- TOC entry 230 (class 1259 OID 41055)
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    order_item_id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name character varying(200),
    brand character varying(100),
    size_ml integer,
    quantity integer,
    price integer
);


--
-- TOC entry 229 (class 1259 OID 41054)
-- Name: order_items_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 229
-- Name: order_items_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_order_item_id_seq OWNED BY public.order_items.order_item_id;


--
-- TOC entry 242 (class 1259 OID 74395)
-- Name: order_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_tracking (
    tracking_id integer NOT NULL,
    order_id integer NOT NULL,
    courier character varying(50),
    tracking_number character varying(100),
    status character varying(100),
    description text,
    location character varying(200),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 241 (class 1259 OID 74394)
-- Name: order_tracking_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_tracking_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 241
-- Name: order_tracking_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_tracking_tracking_id_seq OWNED BY public.order_tracking.tracking_id;


--
-- TOC entry 228 (class 1259 OID 41032)
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    user_id integer NOT NULL,
    order_code character varying(50),
    status public.enum_orders_status DEFAULT 'pending'::public.enum_orders_status,
    total_price integer NOT NULL,
    shipping_name character varying(100),
    shipping_phone character varying(20),
    shipping_address text,
    shipping_city character varying(100),
    shipping_notes text,
    payment_method character varying(50) DEFAULT 'QRIS'::character varying,
    payment_proof character varying(255),
    paid_at timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    delivery_method public.enum_orders_delivery_method DEFAULT 'delivery'::public.enum_orders_delivery_method,
    courier character varying(50),
    courier_service character varying(50),
    shipping_cost integer DEFAULT 0,
    tracking_number character varying(100),
    voucher_code character varying(50),
    discount_amount integer DEFAULT 0,
    pickup_store_id integer
);


--
-- TOC entry 227 (class 1259 OID 41031)
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 227
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- TOC entry 220 (class 1259 OID 24586)
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    brand character varying(100) NOT NULL,
    product_name character varying(200) NOT NULL,
    concentration character varying(50),
    inspirator character varying(200),
    gender public.enum_products_gender DEFAULT 'Unisex'::public.enum_products_gender,
    top_notes text,
    middle_notes text,
    base_notes text,
    main_accords text,
    longevity_hours integer,
    longevity_display character varying(50),
    pros text,
    cons text,
    characteristic text,
    description text,
    cost_price_per_ml integer,
    price_1ml integer,
    price_2ml integer,
    price_3ml integer,
    price_5ml integer,
    stock_ml double precision DEFAULT '0'::double precision,
    sold_count integer DEFAULT 0,
    weight_g character varying(20),
    is_active boolean DEFAULT true,
    image_filename character varying(255) DEFAULT 'default.png'::character varying,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    stock_1ml integer DEFAULT 0 NOT NULL,
    stock_2ml integer DEFAULT 0 NOT NULL,
    stock_3ml integer DEFAULT 0 NOT NULL,
    stock_5ml integer DEFAULT 0 NOT NULL,
    stock_ml_initial numeric(10,1) DEFAULT 0,
    price_10ml integer
);


--
-- TOC entry 219 (class 1259 OID 24585)
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 219
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- TOC entry 232 (class 1259 OID 49249)
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    is_active boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 231 (class 1259 OID 49248)
-- Name: reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 231
-- Name: reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_review_id_seq OWNED BY public.reviews.review_id;


--
-- TOC entry 248 (class 1259 OID 107439)
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    store_id integer NOT NULL,
    name character varying(100) NOT NULL,
    city character varying(100) NOT NULL,
    address text NOT NULL,
    phone character varying(30),
    maps_url character varying(500),
    is_active boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 247 (class 1259 OID 107438)
-- Name: stores_store_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stores_store_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 247
-- Name: stores_store_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stores_store_id_seq OWNED BY public.stores.store_id;


--
-- TOC entry 244 (class 1259 OID 91056)
-- Name: system_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_configs (
    config_id integer NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    description character varying(255),
    updated_by integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 243 (class 1259 OID 91055)
-- Name: system_configs_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_configs_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 243
-- Name: system_configs_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_configs_config_id_seq OWNED BY public.system_configs.config_id;


--
-- TOC entry 246 (class 1259 OID 91078)
-- Name: system_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_logs (
    log_id integer NOT NULL,
    level public.enum_system_logs_level DEFAULT 'info'::public.enum_system_logs_level,
    message text NOT NULL,
    source character varying(255),
    user_id integer,
    metadata jsonb,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 245 (class 1259 OID 91077)
-- Name: system_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 245
-- Name: system_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_logs_log_id_seq OWNED BY public.system_logs.log_id;


--
-- TOC entry 222 (class 1259 OID 32792)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255),
    phone character varying(20),
    avatar character varying(255) DEFAULT 'default-avatar.png'::character varying,
    role public.enum_users_role DEFAULT 'customer'::public.enum_users_role,
    google_id character varying(255),
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    pref_gender public.enum_users_pref_gender,
    pref_aroma character varying(100),
    pref_longevity character varying(50),
    reset_token character varying(255),
    reset_token_expires timestamp with time zone,
    username character varying(50),
    birth_date date,
    gender public.enum_users_gender,
    bio text,
    last_login_at timestamp without time zone
);


--
-- TOC entry 221 (class 1259 OID 32791)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 240 (class 1259 OID 74376)
-- Name: vouchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vouchers (
    voucher_id integer NOT NULL,
    code character varying(50) NOT NULL,
    type public.enum_vouchers_type DEFAULT 'percentage'::public.enum_vouchers_type,
    value integer NOT NULL,
    min_purchase integer DEFAULT 0,
    max_discount integer,
    quota integer DEFAULT 1,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expired_at timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- TOC entry 239 (class 1259 OID 74375)
-- Name: vouchers_voucher_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vouchers_voucher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 239
-- Name: vouchers_voucher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vouchers_voucher_id_seq OWNED BY public.vouchers.voucher_id;


--
-- TOC entry 4990 (class 2604 OID 74348)
-- Name: addresses address_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses ALTER COLUMN address_id SET DEFAULT nextval('public.addresses_address_id_seq'::regclass);


--
-- TOC entry 4975 (class 2604 OID 32863)
-- Name: cart_items cart_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN cart_item_id SET DEFAULT nextval('public.cart_items_cart_item_id_seq'::regclass);


--
-- TOC entry 4974 (class 2604 OID 32847)
-- Name: carts cart_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts ALTER COLUMN cart_id SET DEFAULT nextval('public.carts_cart_id_seq'::regclass);


--
-- TOC entry 5005 (class 2604 OID 189362)
-- Name: couriers courier_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couriers ALTER COLUMN courier_id SET DEFAULT nextval('public.couriers_courier_id_seq'::regclass);


--
-- TOC entry 4989 (class 2604 OID 74326)
-- Name: favorites favorite_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites ALTER COLUMN favorite_id SET DEFAULT nextval('public.favorites_favorite_id_seq'::regclass);


--
-- TOC entry 4986 (class 2604 OID 49285)
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- TOC entry 4983 (class 2604 OID 41058)
-- Name: order_items order_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN order_item_id SET DEFAULT nextval('public.order_items_order_item_id_seq'::regclass);


--
-- TOC entry 4999 (class 2604 OID 74398)
-- Name: order_tracking tracking_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_tracking ALTER COLUMN tracking_id SET DEFAULT nextval('public.order_tracking_tracking_id_seq'::regclass);


--
-- TOC entry 4977 (class 2604 OID 41035)
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- TOC entry 4958 (class 2604 OID 24589)
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- TOC entry 4984 (class 2604 OID 49252)
-- Name: reviews review_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN review_id SET DEFAULT nextval('public.reviews_review_id_seq'::regclass);


--
-- TOC entry 5003 (class 2604 OID 107442)
-- Name: stores store_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores ALTER COLUMN store_id SET DEFAULT nextval('public.stores_store_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 91059)
-- Name: system_configs config_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs ALTER COLUMN config_id SET DEFAULT nextval('public.system_configs_config_id_seq'::regclass);


--
-- TOC entry 5001 (class 2604 OID 91081)
-- Name: system_logs log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN log_id SET DEFAULT nextval('public.system_logs_log_id_seq'::regclass);


--
-- TOC entry 4969 (class 2604 OID 32795)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4993 (class 2604 OID 74379)
-- Name: vouchers voucher_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers ALTER COLUMN voucher_id SET DEFAULT nextval('public.vouchers_voucher_id_seq'::regclass);


--
-- TOC entry 5113 (class 2606 OID 74363)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (address_id);


--
-- TOC entry 5067 (class 2606 OID 32874)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id);


--
-- TOC entry 5065 (class 2606 OID 32853)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (cart_id);


--
-- TOC entry 5141 (class 2606 OID 189375)
-- Name: couriers couriers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couriers
    ADD CONSTRAINT couriers_code_key UNIQUE (code);


--
-- TOC entry 5143 (class 2606 OID 189373)
-- Name: couriers couriers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.couriers
    ADD CONSTRAINT couriers_pkey PRIMARY KEY (courier_id);


--
-- TOC entry 5111 (class 2606 OID 74333)
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (favorite_id);


--
-- TOC entry 5109 (class 2606 OID 49297)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 5105 (class 2606 OID 41063)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- TOC entry 5131 (class 2606 OID 74406)
-- Name: order_tracking order_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT order_tracking_pkey PRIMARY KEY (tracking_id);


--
-- TOC entry 5069 (class 2606 OID 90914)
-- Name: orders orders_order_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key UNIQUE (order_code);


--
-- TOC entry 5071 (class 2606 OID 90916)
-- Name: orders orders_order_code_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key1 UNIQUE (order_code);


--
-- TOC entry 5073 (class 2606 OID 90908)
-- Name: orders orders_order_code_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key10 UNIQUE (order_code);


--
-- TOC entry 5075 (class 2606 OID 90930)
-- Name: orders orders_order_code_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key11 UNIQUE (order_code);


--
-- TOC entry 5077 (class 2606 OID 90932)
-- Name: orders orders_order_code_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key12 UNIQUE (order_code);


--
-- TOC entry 5079 (class 2606 OID 90906)
-- Name: orders orders_order_code_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key13 UNIQUE (order_code);


--
-- TOC entry 5081 (class 2606 OID 90934)
-- Name: orders orders_order_code_key14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key14 UNIQUE (order_code);


--
-- TOC entry 5083 (class 2606 OID 90904)
-- Name: orders orders_order_code_key15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key15 UNIQUE (order_code);


--
-- TOC entry 5085 (class 2606 OID 90936)
-- Name: orders orders_order_code_key16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key16 UNIQUE (order_code);


--
-- TOC entry 5087 (class 2606 OID 90918)
-- Name: orders orders_order_code_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key2 UNIQUE (order_code);


--
-- TOC entry 5089 (class 2606 OID 90920)
-- Name: orders orders_order_code_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key3 UNIQUE (order_code);


--
-- TOC entry 5091 (class 2606 OID 90912)
-- Name: orders orders_order_code_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key4 UNIQUE (order_code);


--
-- TOC entry 5093 (class 2606 OID 90922)
-- Name: orders orders_order_code_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key5 UNIQUE (order_code);


--
-- TOC entry 5095 (class 2606 OID 90924)
-- Name: orders orders_order_code_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key6 UNIQUE (order_code);


--
-- TOC entry 5097 (class 2606 OID 90910)
-- Name: orders orders_order_code_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key7 UNIQUE (order_code);


--
-- TOC entry 5099 (class 2606 OID 90926)
-- Name: orders orders_order_code_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key8 UNIQUE (order_code);


--
-- TOC entry 5101 (class 2606 OID 90928)
-- Name: orders orders_order_code_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key9 UNIQUE (order_code);


--
-- TOC entry 5103 (class 2606 OID 41046)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- TOC entry 5009 (class 2606 OID 24603)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- TOC entry 5107 (class 2606 OID 49263)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (review_id);


--
-- TOC entry 5139 (class 2606 OID 107453)
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (store_id);


--
-- TOC entry 5133 (class 2606 OID 91069)
-- Name: system_configs system_configs_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_key_key UNIQUE (key);


--
-- TOC entry 5135 (class 2606 OID 91067)
-- Name: system_configs system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (config_id);


--
-- TOC entry 5137 (class 2606 OID 91089)
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (log_id);


--
-- TOC entry 5011 (class 2606 OID 90804)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5013 (class 2606 OID 90806)
-- Name: users users_email_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key1 UNIQUE (email);


--
-- TOC entry 5015 (class 2606 OID 90820)
-- Name: users users_email_key10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key10 UNIQUE (email);


--
-- TOC entry 5017 (class 2606 OID 90822)
-- Name: users users_email_key11; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key11 UNIQUE (email);


--
-- TOC entry 5019 (class 2606 OID 90798)
-- Name: users users_email_key12; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key12 UNIQUE (email);


--
-- TOC entry 5021 (class 2606 OID 90824)
-- Name: users users_email_key13; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key13 UNIQUE (email);


--
-- TOC entry 5023 (class 2606 OID 90826)
-- Name: users users_email_key14; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key14 UNIQUE (email);


--
-- TOC entry 5025 (class 2606 OID 90796)
-- Name: users users_email_key15; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key15 UNIQUE (email);


--
-- TOC entry 5027 (class 2606 OID 90828)
-- Name: users users_email_key16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key16 UNIQUE (email);


--
-- TOC entry 5029 (class 2606 OID 90794)
-- Name: users users_email_key17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key17 UNIQUE (email);


--
-- TOC entry 5031 (class 2606 OID 90830)
-- Name: users users_email_key18; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key18 UNIQUE (email);


--
-- TOC entry 5033 (class 2606 OID 90808)
-- Name: users users_email_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key2 UNIQUE (email);


--
-- TOC entry 5035 (class 2606 OID 90810)
-- Name: users users_email_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key3 UNIQUE (email);


--
-- TOC entry 5037 (class 2606 OID 90812)
-- Name: users users_email_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key4 UNIQUE (email);


--
-- TOC entry 5039 (class 2606 OID 90814)
-- Name: users users_email_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key5 UNIQUE (email);


--
-- TOC entry 5041 (class 2606 OID 90802)
-- Name: users users_email_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key6 UNIQUE (email);


--
-- TOC entry 5043 (class 2606 OID 90816)
-- Name: users users_email_key7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key7 UNIQUE (email);


--
-- TOC entry 5045 (class 2606 OID 90818)
-- Name: users users_email_key8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key8 UNIQUE (email);


--
-- TOC entry 5047 (class 2606 OID 90800)
-- Name: users users_email_key9; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key9 UNIQUE (email);


--
-- TOC entry 5049 (class 2606 OID 32808)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5051 (class 2606 OID 90849)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5053 (class 2606 OID 90851)
-- Name: users users_username_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key1 UNIQUE (username);


--
-- TOC entry 5055 (class 2606 OID 90853)
-- Name: users users_username_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key2 UNIQUE (username);


--
-- TOC entry 5057 (class 2606 OID 90847)
-- Name: users users_username_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key3 UNIQUE (username);


--
-- TOC entry 5059 (class 2606 OID 90855)
-- Name: users users_username_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key4 UNIQUE (username);


--
-- TOC entry 5061 (class 2606 OID 90845)
-- Name: users users_username_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key5 UNIQUE (username);


--
-- TOC entry 5063 (class 2606 OID 90857)
-- Name: users users_username_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key6 UNIQUE (username);


--
-- TOC entry 5115 (class 2606 OID 91023)
-- Name: vouchers vouchers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key UNIQUE (code);


--
-- TOC entry 5117 (class 2606 OID 91025)
-- Name: vouchers vouchers_code_key1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key1 UNIQUE (code);


--
-- TOC entry 5119 (class 2606 OID 91027)
-- Name: vouchers vouchers_code_key2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key2 UNIQUE (code);


--
-- TOC entry 5121 (class 2606 OID 91021)
-- Name: vouchers vouchers_code_key3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key3 UNIQUE (code);


--
-- TOC entry 5123 (class 2606 OID 91029)
-- Name: vouchers vouchers_code_key4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key4 UNIQUE (code);


--
-- TOC entry 5125 (class 2606 OID 91019)
-- Name: vouchers vouchers_code_key5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key5 UNIQUE (code);


--
-- TOC entry 5127 (class 2606 OID 91031)
-- Name: vouchers vouchers_code_key6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_code_key6 UNIQUE (code);


--
-- TOC entry 5129 (class 2606 OID 74391)
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (voucher_id);


--
-- TOC entry 5155 (class 2606 OID 91000)
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE;


--
-- TOC entry 5145 (class 2606 OID 90879)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5146 (class 2606 OID 90884)
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 90872)
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5153 (class 2606 OID 90993)
-- Name: favorites favorites_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE;


--
-- TOC entry 5154 (class 2606 OID 90988)
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE;


--
-- TOC entry 5152 (class 2606 OID 90975)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5148 (class 2606 OID 90950)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5149 (class 2606 OID 90955)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE;


--
-- TOC entry 5156 (class 2606 OID 91046)
-- Name: order_tracking order_tracking_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_tracking
    ADD CONSTRAINT order_tracking_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON UPDATE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 90896)
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE;


--
-- TOC entry 5150 (class 2606 OID 90965)
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON UPDATE CASCADE;


--
-- TOC entry 5151 (class 2606 OID 90960)
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE;


-- Completed on 2026-11-11 11:40:43

--
-- PostgreSQL database dump complete
--

\unrestrict Fp1379RjCbI9vMsht7hU9ezj9TJkpmfcokUztA3h4YfbcQo7A3LEI3KC1hph6Iz

