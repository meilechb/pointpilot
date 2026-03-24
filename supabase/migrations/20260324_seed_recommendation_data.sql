-- ============================================================
-- Seed: Route Regions (universal zones used across programs)
-- ============================================================
INSERT INTO route_regions (region_name, program_name, airport_codes, country_codes, description) VALUES
('North America', NULL, ARRAY['JFK','EWR','LGA','LAX','SFO','ORD','MIA','ATL','DFW','SEA','BOS','DCA','IAD','IAH','DEN','PHX','MSP','DTW','PHL','CLT','FLL','MCO','TPA','SAN','SJC','OAK','BWI','MDW','HNL','ANC','YYZ','YUL','YVR','YOW','YEG','YWG','MEX','CUN','GDL'], ARRAY['US','CA','MX'], 'United States, Canada, Mexico'),
('Europe', NULL, ARRAY['LHR','LGW','CDG','ORY','FRA','MUC','AMS','FCO','MAD','BCN','LIS','ZRH','VIE','CPH','OSL','ARN','HEL','DUB','ATH','IST','WAW','PRG','BUD','BRU'], ARRAY['GB','FR','DE','IT','ES','PT','NL','CH','AT','DK','NO','SE','FI','IE','GR','TR','PL','CZ','HU','BE'], 'Western and Central Europe'),
('Asia', NULL, ARRAY['NRT','HND','ICN','GMP','PVG','PEK','HKG','SIN','BKK','DMK','KUL','MNL','SGN','HAN','DEL','BOM','TPE','KIX'], ARRAY['JP','KR','CN','HK','SG','TH','MY','PH','VN','IN','TW','ID'], 'East, Southeast, and South Asia'),
('Middle East', NULL, ARRAY['DXB','DOH','AUH','JED','RUH','AMM','TLV','CAI','BAH','MCT','KWI'], ARRAY['AE','QA','SA','JO','IL','EG','BH','OM','KW'], 'Middle East and Gulf states'),
('South America', NULL, ARRAY['GRU','GIG','EZE','SCL','LIM','BOG','UIO','CCS','MVD'], ARRAY['BR','AR','CL','PE','CO','EC','VE','UY'], 'South America'),
('Africa', NULL, ARRAY['JNB','CPT','NBO','ADD','CMN','CAI','LOS','ACC','DAR'], ARRAY['ZA','KE','ET','MA','EG','NG','GH','TZ'], 'Africa'),
('Oceania', NULL, ARRAY['SYD','MEL','BNE','AKL','PER','NAN'], ARRAY['AU','NZ','FJ'], 'Australia, New Zealand, Pacific Islands'),
('Central America/Caribbean', NULL, ARRAY['SJO','PTY','SJU','MBJ','NAS','PUJ','SDQ','HAV','BGI'], ARRAY['CR','PA','PR','JM','BS','DO','CU','BB'], 'Central America and Caribbean');

-- ============================================================
-- Seed: Award Charts (top programs, major routes, one-way pricing)
-- ============================================================

-- United MileagePlus (dynamic pricing)
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('United MileagePlus', 'North America', 'Europe', 'economy', 'dynamic', 30000, 70000, 'Saver starts at 30K, standard up to 70K'),
('United MileagePlus', 'North America', 'Europe', 'business', 'dynamic', 60000, 150000, 'Partner awards often better value'),
('United MileagePlus', 'North America', 'Asia', 'economy', 'dynamic', 35000, 80000, NULL),
('United MileagePlus', 'North America', 'Asia', 'business', 'dynamic', 75000, 200000, NULL),
('United MileagePlus', 'North America', 'North America', 'economy', 'dynamic', 5000, 35000, 'Short domestic flights start at 5K');

-- American Airlines AAdvantage (dynamic pricing)
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('American Airlines AAdvantage', 'North America', 'Europe', 'economy', 'dynamic', 30000, 75000, 'Web specials can be 20-25K'),
('American Airlines AAdvantage', 'North America', 'Europe', 'business', 'dynamic', 57500, 200000, NULL),
('American Airlines AAdvantage', 'North America', 'Asia', 'economy', 'dynamic', 35000, 75000, NULL),
('American Airlines AAdvantage', 'North America', 'Asia', 'business', 'dynamic', 60000, 200000, 'Partner awards on CX/JL can be great value'),
('American Airlines AAdvantage', 'North America', 'South America', 'economy', 'dynamic', 15000, 50000, NULL),
('American Airlines AAdvantage', 'North America', 'South America', 'business', 'dynamic', 30000, 120000, NULL);

-- British Airways Executive Club (distance-based Avios chart)
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('British Airways Executive Club', 'North America', 'North America', 'economy', 'fixed', 7500, NULL, 'Under 1,150 miles — book AA flights for 7,500 Avios'),
('British Airways Executive Club', 'North America', 'Europe', 'economy', 'fixed', 13000, NULL, 'Off-peak pricing available'),
('British Airways Executive Club', 'North America', 'Europe', 'business', 'fixed', 50000, NULL, 'High fuel surcharges on BA metal'),
('British Airways Executive Club', 'Europe', 'Europe', 'economy', 'fixed', 7500, NULL, 'Great for short-haul European flights');

-- Virgin Atlantic Flying Club
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Virgin Atlantic Flying Club', 'North America', 'Asia', 'business', 'fixed', 90000, 120000, 'ANA business class — top sweet spot. 90K RT via VS is_one_way=false'),
('Virgin Atlantic Flying Club', 'North America', 'Europe', 'economy', 'dynamic', 10000, 30000, 'VS own metal or Delta'),
('Virgin Atlantic Flying Club', 'North America', 'Europe', 'business', 'dynamic', 45000, 100000, NULL);

-- Air Canada Aeroplan
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Air Canada Aeroplan', 'North America', 'Europe', 'economy', 'fixed', 25000, NULL, 'Fixed chart on Star Alliance partners'),
('Air Canada Aeroplan', 'North America', 'Europe', 'business', 'fixed', 60000, NULL, 'Mixed-cabin awards available for savings'),
('Air Canada Aeroplan', 'North America', 'Asia', 'economy', 'fixed', 35000, NULL, NULL),
('Air Canada Aeroplan', 'North America', 'Asia', 'business', 'fixed', 75000, NULL, 'Stopover allowed for +5,000 points'),
('Air Canada Aeroplan', 'North America', 'Middle East', 'business', 'fixed', 70000, NULL, 'Can book Etihad and Emirates as partners');

-- Turkish Airlines Miles&Smiles
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Turkish Airlines Miles&Smiles', 'North America', 'Europe', 'economy', 'fixed', 15000, NULL, 'Including Turkey'),
('Turkish Airlines Miles&Smiles', 'North America', 'Europe', 'business', 'fixed', 45000, NULL, 'Sweet spot: business class for 45K'),
('Turkish Airlines Miles&Smiles', 'North America', 'Asia', 'business', 'fixed', 52500, NULL, 'Star Alliance partners');

-- Air France-KLM Flying Blue (monthly promos)
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Air France-KLM Flying Blue', 'North America', 'Europe', 'economy', 'dynamic', 17000, 53000, 'Promo awards as low as 17K one-way'),
('Air France-KLM Flying Blue', 'North America', 'Europe', 'business', 'dynamic', 53000, 120000, 'Monthly promo awards 25-50% off'),
('Air France-KLM Flying Blue', 'Europe', 'Europe', 'economy', 'dynamic', 6000, 20000, 'Intra-Europe promo flights can be very cheap');

-- Avianca LifeMiles (no fuel surcharges)
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Avianca LifeMiles', 'North America', 'Europe', 'economy', 'fixed', 25000, NULL, 'No fuel surcharges on Star Alliance'),
('Avianca LifeMiles', 'North America', 'Europe', 'business', 'fixed', 63000, NULL, 'Often cheapest way to book LH/LX/OS'),
('Avianca LifeMiles', 'North America', 'Asia', 'business', 'fixed', 70000, NULL, 'No surcharges on ANA, SQ, etc.');

-- Singapore Airlines KrisFlyer
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Singapore Airlines KrisFlyer', 'North America', 'Asia', 'economy', 'fixed', 38000, NULL, 'On SQ metal'),
('Singapore Airlines KrisFlyer', 'North America', 'Asia', 'business', 'fixed', 92000, NULL, 'SQ new business class is excellent'),
('Singapore Airlines KrisFlyer', 'North America', 'Asia', 'first', 'fixed', 125000, NULL, 'Required for booking SQ Suites — cannot use other Star Alliance miles');

-- Delta SkyMiles (fully dynamic)
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Delta SkyMiles', 'North America', 'Europe', 'economy', 'dynamic', 28000, 100000, 'Flash sales occasionally under 20K'),
('Delta SkyMiles', 'North America', 'Europe', 'business', 'dynamic', 75000, 300000, 'Delta One pricing varies wildly'),
('Delta SkyMiles', 'North America', 'Asia', 'business', 'dynamic', 85000, 350000, 'Partner awards on Korean Air can be better');

-- Alaska Airlines Mileage Plan
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Alaska Airlines Mileage Plan', 'North America', 'Asia', 'business', 'fixed', 55000, NULL, 'Cathay Pacific business class on partner chart'),
('Alaska Airlines Mileage Plan', 'North America', 'Asia', 'first', 'fixed', 70000, NULL, 'CX first class 70K — incredible value'),
('Alaska Airlines Mileage Plan', 'North America', 'Middle East', 'first', 'fixed', 115000, NULL, 'Emirates first class');

-- Emirates Skywards
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Emirates Skywards', 'North America', 'Middle East', 'economy', 'fixed', 45000, NULL, NULL),
('Emirates Skywards', 'North America', 'Middle East', 'business', 'fixed', 108750, NULL, 'A380 business with onboard lounge'),
('Emirates Skywards', 'North America', 'Middle East', 'first', 'fixed', 136250, NULL, 'A380 first class with shower — bucket list redemption');

-- Qatar Airways Privilege Club
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('Qatar Airways Privilege Club', 'North America', 'Middle East', 'economy', 'fixed', 35000, NULL, NULL),
('Qatar Airways Privilege Club', 'North America', 'Middle East', 'business', 'fixed', 70000, NULL, 'Qsuites — among the best business class products'),
('Qatar Airways Privilege Club', 'North America', 'Asia', 'business', 'fixed', 85000, NULL, 'Via DOH connection');

-- ANA Mileage Club
INSERT INTO award_charts (program_name, origin_region, destination_region, cabin_class, pricing_type, points_min, points_max, notes) VALUES
('ANA Mileage Club', 'North America', 'Asia', 'economy', 'fixed', 30000, 40000, 'Low/regular season pricing. Round-trip required.'),
('ANA Mileage Club', 'North America', 'Asia', 'business', 'fixed', 75000, 90000, 'Low/regular season. Great for NH first class.'),
('ANA Mileage Club', 'North America', 'Asia', 'first', 'fixed', 105000, 165000, 'ANA first class is an amazing product');

-- ============================================================
-- Seed: Surcharge Profiles (known high-surcharge programs)
-- ============================================================
INSERT INTO surcharge_profiles (booking_program, operating_airline, route_type, estimated_surcharge_usd, surcharge_level, notes) VALUES
('British Airways Executive Club', 'BA', 'transatlantic', 500, 'extreme', 'BA Avios on BA metal has very high fuel surcharges. Book AA/IB instead to avoid.'),
('British Airways Executive Club', 'AA', 'transatlantic', 6, 'none', 'No fuel surcharges when booking AA flights with Avios'),
('British Airways Executive Club', 'BA', 'intra-europe', 80, 'medium', 'Lower surcharges on short-haul BA flights'),
('Lufthansa Miles & More', 'LH', 'transatlantic', 400, 'high', 'High surcharges on LH group metal. Use LifeMiles instead.'),
('Lufthansa Miles & More', 'LX', 'transatlantic', 350, 'high', 'Swiss also passes through high surcharges via Miles & More'),
('Singapore Airlines KrisFlyer', 'SQ', 'transpacific', 150, 'medium', 'Moderate surcharges on SQ metal'),
('Air France-KLM Flying Blue', 'AF', 'transatlantic', 200, 'medium', 'Moderate surcharges on AF metal'),
('Air France-KLM Flying Blue', 'KL', 'transatlantic', 200, 'medium', 'Similar surcharges on KLM'),
('Avianca LifeMiles', 'LH', NULL, 0, 'none', 'LifeMiles does NOT pass through fuel surcharges on LH bookings'),
('Avianca LifeMiles', 'SQ', NULL, 0, 'none', 'No surcharges via LifeMiles'),
('Avianca LifeMiles', 'NH', NULL, 0, 'none', 'No surcharges on ANA via LifeMiles'),
('Alaska Airlines Mileage Plan', 'CX', NULL, 0, 'none', 'No fuel surcharges on CX bookings via Alaska'),
('Alaska Airlines Mileage Plan', 'JL', NULL, 0, 'none', 'No surcharges on JAL via Alaska'),
('Emirates Skywards', 'EK', 'transatlantic', 250, 'medium', 'Moderate surcharges on Emirates own metal'),
('Virgin Atlantic Flying Club', 'VS', 'transatlantic', 200, 'medium', 'Moderate surcharges on VS metal'),
('Virgin Atlantic Flying Club', 'NH', NULL, 0, 'none', 'No surcharges when booking ANA via Virgin Atlantic');

-- ============================================================
-- Seed: Program Rules
-- ============================================================
INSERT INTO program_rules (program_name, rule_type, rule_value, notes) VALUES
('Air Canada Aeroplan', 'stopover', '{"allowed": true, "cost_points": 5000, "max_stopovers": 1, "duration_max_days": 14}', 'Add a stopover for just 5,000 extra points'),
('ANA Mileage Club', 'stopover', '{"allowed": true, "cost_points": 0, "max_stopovers": 1, "roundtrip_only": true}', 'Free stopover on round-trip awards'),
('ANA Mileage Club', 'roundtrip_required', '{"required": true}', 'ANA requires round-trip bookings for award tickets'),
('Turkish Airlines Miles&Smiles', 'transfer_time', '{"typical_hours": 24, "instant": false}', 'Transfers from bank programs typically take 24 hours'),
('United MileagePlus', 'transfer_time', '{"typical_hours": 0, "instant": true}', 'Chase UR transfers to United are instant'),
('British Airways Executive Club', 'transfer_time', '{"typical_hours": 0, "instant": true}', 'Chase and Amex transfers to BA are usually instant'),
('Air France-KLM Flying Blue', 'transfer_time', '{"typical_hours": 24, "instant": false}', 'Transfers typically 24-48 hours'),
('Virgin Atlantic Flying Club', 'transfer_time', '{"typical_hours": 0, "instant": true}', 'Amex and Chase transfers to VS are instant'),
('Singapore Airlines KrisFlyer', 'transfer_time', '{"typical_hours": 24, "instant": false}', 'Transfers usually 12-24 hours'),
('Avianca LifeMiles', 'transfer_time', '{"typical_hours": 24, "instant": false}', 'Amex transfers may take 1-2 business days'),
('Air Canada Aeroplan', 'transfer_time', '{"typical_hours": 0, "instant": true}', 'Chase and Amex transfers are instant'),
('Alaska Airlines Mileage Plan', 'transfer_time', '{"typical_hours": 0, "instant": true}', 'Bilt transfers to Alaska are instant'),
('British Airways Executive Club', 'min_transfer', '{"minimum_points": 1000}', 'Minimum transfer of 1,000 points'),
('Air Canada Aeroplan', 'mixed_cabin', '{"allowed": true, "notes": "Can mix economy and business segments on the same ticket"}', 'Mixed-cabin awards save points on connecting flights');

-- ============================================================
-- Seed: Sweet Spots DB (migrated from static data + enhanced)
-- ============================================================
INSERT INTO sweet_spots_db (title, programs, origin_region, destination_region, cabin_class, points_required, estimated_cpp, estimated_cash_value, description, booking_steps, priority, tags) VALUES
('ANA Business Class via Virgin Atlantic', ARRAY['Virgin Atlantic Flying Club', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Bilt Rewards'], 'North America', 'Asia', 'business', 90000, 4.0, 8000, 'Transfer Chase, Amex, or Bilt to Virgin Atlantic. Book ANA business class roundtrip for 90,000-120,000 points. One of the best sweet spots in award travel.', ARRAY['Transfer 90K-120K bank points to Virgin Atlantic Flying Club','Log into Virgin Atlantic and search for ANA flights','Book round-trip business class to Japan','Pay minimal taxes (~$100-200)'], 100, ARRAY['luxury', 'aspirational', 'japan']),
('British Airways Avios Short-Haul on AA', ARRAY['British Airways Executive Club', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Bilt Rewards'], 'North America', 'North America', 'economy', 7500, 3.0, 250, 'Book American Airlines domestic flights using BA Avios for 7,500 points one-way in economy on flights under 1,150 miles. Transfer from Chase, Amex, or Bilt.', ARRAY['Transfer 7,500 points to British Airways Executive Club','Search for AA flights under 1,150 miles on ba.com','Book economy for 7,500 Avios + $5.60 taxes'], 95, ARRAY['domestic', 'budget', 'easy']),
('Turkish Miles&Smiles Business to Europe', ARRAY['Turkish Airlines Miles&Smiles', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'], 'North America', 'Europe', 'business', 45000, 3.5, 3500, 'Transfer Citi, Capital One, or Bilt to Turkish. Book Star Alliance business class to Europe for 45,000 miles one-way.', ARRAY['Transfer 45,000 points to Turkish Airlines Miles&Smiles','Wait ~24 hours for transfer','Search for Star Alliance business class on turkishairlines.com','Book for 45,000 miles + minimal taxes'], 90, ARRAY['europe', 'luxury']),
('Flying Blue Promo Awards to Europe', ARRAY['Air France-KLM Flying Blue', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'], 'North America', 'Europe', 'economy', 17000, 2.5, 500, 'Monthly promo awards on Air France/KLM with 25-50% off. Economy US-Europe can go as low as 17,000 miles one-way.', ARRAY['Check flyingblue.com/en/promo-rewards monthly for deals','Transfer points to Flying Blue when a good promo appears','Book promo award tickets quickly (limited availability)'], 85, ARRAY['europe', 'budget', 'promo']),
('Aeroplan on Star Alliance Partners', ARRAY['Air Canada Aeroplan', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Capital One Miles', 'Bilt Rewards'], 'North America', 'Europe', 'business', 60000, 3.0, 3500, 'Aeroplan has competitive partner award pricing plus Etihad/Emirates as bonus partners. Mixed-cabin awards allow premium savings.', ARRAY['Transfer points to Air Canada Aeroplan (instant from Chase/Amex)','Search for Star Alliance business class on aeroplan.com','Consider mixed-cabin awards to save points','Add a stopover for just 5,000 extra points'], 80, ARRAY['europe', 'asia', 'flexible']),
('Alaska Mileage Plan on CX/JAL First', ARRAY['Alaska Airlines Mileage Plan', 'Bilt Rewards'], 'North America', 'Asia', 'first', 70000, 5.0, 10000, 'Alaska has generous partner charts. Cathay Pacific first class 70K one-way, JAL business 60K one-way US to Asia.', ARRAY['Transfer Bilt points to Alaska Airlines Mileage Plan','Search for CX/JL award availability','Book first class for 70K miles one-way','No fuel surcharges on CX/JL via Alaska'], 85, ARRAY['luxury', 'aspirational', 'asia']),
('Chase Portal with Sapphire Reserve', ARRAY['Chase Ultimate Rewards'], 'North America', 'North America', 'economy', NULL, 1.5, NULL, 'When transfer partners don''t yield better value, book any flight through Chase Travel at 1.5 cpp with the Sapphire Reserve. Simple and no transfer needed.', ARRAY['Log into Chase Travel Portal','Search for your flight','Book at 1.5 cents per point value'], 50, ARRAY['fallback', 'easy', 'domestic']),
('LifeMiles on Star Alliance (No Surcharges)', ARRAY['Avianca LifeMiles', 'Amex Membership Rewards', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'], 'North America', 'Europe', 'business', 63000, 2.0, 3500, 'LifeMiles charges no fuel surcharges on most Star Alliance partners. Often the cheapest way to book Lufthansa, Swiss, or ANA.', ARRAY['Transfer points to Avianca LifeMiles','Search for Star Alliance availability on lifemiles.com','Book with zero fuel surcharges','Pay only minimal taxes'], 75, ARRAY['europe', 'asia', 'no-surcharges']),
('Emirates A380 First Class', ARRAY['Emirates Skywards', 'Amex Membership Rewards', 'Citi ThankYou Points', 'Capital One Miles', 'Bilt Rewards'], 'North America', 'Middle East', 'first', 136250, 3.5, 12000, 'Transfer to Emirates Skywards for their iconic A380 first class with onboard shower and bar. A bucket-list redemption.', ARRAY['Transfer points to Emirates Skywards','Search for A380 routes on emirates.com','Book first class for ~136,250 miles one-way','Experience the shower, bar, and private suite'], 70, ARRAY['luxury', 'aspirational', 'bucket-list']),
('Iberia Avios to South America on AA', ARRAY['Iberia Plus', 'Chase Ultimate Rewards', 'Amex Membership Rewards', 'Bilt Rewards'], 'North America', 'South America', 'business', 34000, 3.0, 2500, 'Iberia Avios can book American Airlines flights to South America at lower rates than AAdvantage. Off-peak pricing available.', ARRAY['Transfer points to Iberia Plus','Search for AA flights on iberia.com','Book at off-peak Avios rates when available'], 65, ARRAY['south-america', 'off-peak']);
