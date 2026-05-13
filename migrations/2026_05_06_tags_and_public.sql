-- Backfill tags + flip all meals to public (generated 2026-05-06)
-- Review then run in Supabase SQL editor.

BEGIN;

-- 1) Tag updates: existing tags preserved, goodleftovers->good-leftovers,
--    Haiku-suggested content tags + domain-derived source tags merged in.
-- Asian Chicken Meatballs
UPDATE meals SET tags = ARRAY['chicken', 'good-to-freeze', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '00aaed39-3dc0-4bb7-8a74-cf1ec9531136';
-- Slow Cooker Chicken Taco Bowls
UPDATE meals SET tags = ARRAY['chicken', 'crockpot', 'good-to-freeze', 'good-leftovers', 'salad', 'budgetbytes']::text[] WHERE id = '01d79c62-b00e-40af-a99c-a950e3ae37e4';
-- Baked Cinnamon Apple Butter French Toast
UPDATE meals SET tags = ARRAY['vegetarian', 'breakfast', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '02465281-f2ad-4327-96f8-f282eb26887c';
-- Creamy Lentil Sun-dried Tomato Soup
UPDATE meals SET tags = ARRAY['vegetarian', 'soup', 'good-to-freeze', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '026ab3c6-ce89-425a-ab58-a5ebda0d9569';
-- Noodle-Free Pad Thai
UPDATE meals SET tags = ARRAY['vegetarian', 'salad', 'no-dairy', 'gluten-free', 'paleo', 'good-leftovers', 'minimalistbaker']::text[] WHERE id = '031044e0-8d72-4aa1-907d-66402af2ac9a';
-- Easy Dumpling Soup
UPDATE meals SET tags = ARRAY['fish', 'soup', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '03c93ee7-66a4-493e-bd0a-55c01a40d757';
-- Dump n' Bake Chicken Burrito Bowl
UPDATE meals SET tags = ARRAY['good-to-freeze', 'chicken', 'salad', 'good-leftovers', 'featherstone']::text[] WHERE id = '06aeeff2-caa8-4b54-8856-8df04d59f79c';
-- Crispy Orecchiette With Spicy Sausage and Collard Ragù
UPDATE meals SET tags = ARRAY['mollybaz', 'red-meat', 'good-to-freeze', 'pasta', 'good-leftovers']::text[] WHERE id = '07e231c3-8639-4202-b07e-44f02f551355';
-- Beef Bourguignon (Slow Cooker)
UPDATE meals SET tags = ARRAY['red-meat', 'crockpot', 'good-to-freeze', 'good-leftovers', 'soup', 'skinnytaste']::text[] WHERE id = '0817fd2a-691d-4503-b2f2-469417e24269';
-- Chicken Pot Pie Soup
UPDATE meals SET tags = ARRAY['chicken', 'soup', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '08b2b096-2ecf-472a-90af-8f98f0758114';
-- 30 Minute Chili Honey Garlic Salmon Bowls
UPDATE meals SET tags = ARRAY['fish', 'salad', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '098df817-63d2-476a-9378-f7f8856020fd';
-- BBQ Sweet Potato Chickpea Tacos
UPDATE meals SET tags = ARRAY['vegetarian', 'no-dairy', 'good-leftovers', 'minimalistbaker']::text[] WHERE id = '0accb529-4680-4d93-ad2d-616352dc0d03';
-- Skillet Mexican Beef and Rice
UPDATE meals SET tags = ARRAY['red-meat', 'good-to-freeze', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '0db5fdac-3fd6-4dfb-bde5-9e140385ae56';
-- Chicken Egg Roll Bowl
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'salad', 'skinnytaste']::text[] WHERE id = '0dcd8780-6e30-4653-9191-af007af29e88';
-- Mexican Meatball Soup (Albóndigas Soup)
UPDATE meals SET tags = ARRAY['red-meat', 'soup', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '0e0d1497-1ced-43d7-8d59-9ab976cf858f';
-- Asian Chicken Salad with Chili Crisp Dressing
UPDATE meals SET tags = ARRAY['chicken', 'salad', 'gluten-free', 'no-dairy', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '0fb47987-d33f-44ac-aa2e-cc7dffa47dba';
-- Potato and Green Bean Skillet
UPDATE meals SET tags = ARRAY['red-meat', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '10f843b4-99d4-420a-9931-2ec9d97bfa8c';
-- Spicy Chicken Meal Prep with Rice and Beans
UPDATE meals SET tags = ARRAY['chicken', 'good-to-freeze', 'good-leftovers', 'pinchofyum']::text[] WHERE id = '13e0b74d-3013-4e3e-a55a-710cc7c475be';
-- Smoky Red Lentil Soup with Spinach
UPDATE meals SET tags = ARRAY['vegetarian', 'soup', 'good-to-freeze', 'good-leftovers', 'no-dairy', 'pinchofyum']::text[] WHERE id = '144c4f4d-8a6a-45c5-b0fc-32b1dd85d238';
-- Green Goddess Soup
UPDATE meals SET tags = ARRAY['oliviaadriance', 'vegetarian', 'soup', 'good-to-freeze', 'good-leftovers']::text[] WHERE id = '15bcc147-fe90-498b-87e8-416940579c3b';
-- Chicken Kabobs
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '16eac814-06eb-491b-b2db-bf9d2f3f81b9';
-- Cinnamon Sugar Bagel Bake
UPDATE meals SET tags = ARRAY['breakfast', 'good-to-freeze', 'vegetarian', 'good-leftovers', 'featherstone']::text[] WHERE id = '17f01a5a-7738-499a-ac69-f46d60a49ac2';
-- Crockpot Hamburger Helper
UPDATE meals SET tags = ARRAY['red-meat', 'crockpot', 'good-to-freeze', 'good-leftovers', 'pasta', 'halfbakedharvest']::text[] WHERE id = '17f25b0c-efc2-4655-9604-3d2a060e7235';
-- Firecracker Chicken
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '1a427c38-9442-452a-8c12-20b76d571c61';
-- Sweet Potato Chickpea Buddha Bowl
UPDATE meals SET tags = ARRAY['minimalistbaker', 'vegetarian', 'no-dairy', 'gluten-free', 'salad', 'good-leftovers']::text[] WHERE id = '205576c2-473a-47f7-9a6c-e0a9bbdf2f9d';
-- One Pot Cajun Ranch Chicken Pasta
UPDATE meals SET tags = ARRAY['chicken', 'pasta', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '227c5268-1ca1-453f-a957-17ff859f41ee';
-- 30 Minute Spicy Miso Chicken Katsu Ramen
UPDATE meals SET tags = ARRAY['chicken', 'soup', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '22e001db-312b-4867-93e7-39eb5017c34b';
-- Sausage Breakfast Casserole
UPDATE meals SET tags = ARRAY['red-meat', 'breakfast', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '23469554-0174-4533-ae2d-e2deb76eef02';
-- Chicken Egg Roll Bowl
UPDATE meals SET tags = ARRAY['no-dairy', 'good-to-freeze', 'chicken', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '23ae4a39-2a92-4e43-8d1f-73a222519b20';
-- Crockpot Hearty Chicken and Rice Soup
UPDATE meals SET tags = ARRAY['chicken', 'crockpot', 'soup', 'good-to-freeze', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '24d46010-2d25-48d0-b509-0929d6994617';
-- Healthy Zuppa Toscana
UPDATE meals SET tags = ARRAY['no-dairy', 'whole30', 'paleo', 'red-meat', 'soup', 'crockpot', 'good-to-freeze', 'good-leftovers', '40aprons']::text[] WHERE id = '25a03b4e-5414-4169-b5e2-6445f3eac2dd';
-- Chicken Buddha Bowl with Satay Sauce
UPDATE meals SET tags = ARRAY['good-to-freeze', 'chicken', 'salad', 'no-dairy', 'good-leftovers', 'vjcooks']::text[] WHERE id = '26077e44-b8a6-499d-8ab9-eec47c4fc20d';
-- Creamy Garlic Chicken
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '264c48f8-7037-449c-b18a-d24545e771f3';
-- Sheet Pan Tacos
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '2731dac1-7c57-44da-8ded-3b3599fa3212';
-- Carne Molida
UPDATE meals SET tags = ARRAY['red-meat', 'soup', 'good-to-freeze', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '27f1c6d2-64ec-4b56-9331-22e00784cec7';
-- Navy Bean Soup
UPDATE meals SET tags = ARRAY['red-meat', 'soup', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '28aed6e7-bfb2-4b78-8f62-c8f6ee9199df';
-- Easy Vegan Burrito Bowls
UPDATE meals SET tags = ARRAY['vegetarian', 'salad', 'good-leftovers', 'pinchofyum']::text[] WHERE id = '2a3ad8e1-3107-472f-ba66-610f49365dc1';
-- Cozy White Bean Mushroom Stew (Vegan)
UPDATE meals SET tags = ARRAY['vegetarian', 'soup', 'good-to-freeze', 'good-leftovers', 'no-dairy', 'minimalistbaker']::text[] WHERE id = '2df37319-ee2c-4396-a8eb-b1b37628d6a9';
-- Easy Sesame Chicken
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '30074020-c6ef-49b8-b7d4-388935123789';
-- Slow Cooker Hungarian Goulash
UPDATE meals SET tags = ARRAY['red-meat', 'crockpot', 'soup', 'good-to-freeze', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '3085b47e-a2f1-47aa-abe5-835e87ec1305';
-- Lentil Greek Salad with Dill Sauce
UPDATE meals SET tags = ARRAY['fish', 'salad', 'good-leftovers', 'pinchofyum']::text[] WHERE id = '313fa76c-bb75-4fab-b355-07b3cf7e8308';
-- Chickpea and Sweet Potato Buddha Bowl
UPDATE meals SET tags = ARRAY['vegetarian', 'no-dairy', 'gluten-free', 'salad', 'good-leftovers', 'loveandlemons']::text[] WHERE id = '33a9a88c-1efa-46f2-afc4-9712fc729724';
-- Parmesan Garlic Butter Crusted Halibut
UPDATE meals SET tags = ARRAY['halfbakedharvest', 'fish', 'good-leftovers']::text[] WHERE id = '35009d90-7dfd-463a-8653-1e47605f5015';
-- Sausage Tortellini Soup
UPDATE meals SET tags = ARRAY['red-meat', 'soup', 'good-to-freeze', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '35e01634-e778-4b81-addb-ee57ee87b530';
-- Blueberry Muffin Bread
UPDATE meals SET tags = ARRAY['vegetarian', 'breakfast', 'dessert', 'good-to-freeze', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '373a0ba5-bedd-4fbf-9645-ad63083fc51b';
-- High Protein Sheet Pancake Bake
UPDATE meals SET tags = ARRAY['breakfast', 'vegetarian', 'good-to-freeze', 'good-leftovers', 'featherstone']::text[] WHERE id = '37ccfcf0-9d11-4db3-8b8d-fbe4ee6ff2b9';
-- Tater Tot Breakfast Casserole
UPDATE meals SET tags = ARRAY['breakfast', 'good-leftovers', 'good-to-freeze', 'vegetarian', 'featherstone']::text[] WHERE id = '3a6a2d4b-ed84-4b3e-8d16-98c3f58c931c';
-- Meal Prep Breakfast Sandwiches
UPDATE meals SET tags = ARRAY['red-meat', 'breakfast', 'good-to-freeze', 'good-leftovers', 'pinchofyum']::text[] WHERE id = '3b034372-e8cd-4274-aaac-fb0c1ff5f1dc';
-- One Pot Creamy Italian Lasagna Soup
UPDATE meals SET tags = ARRAY['chicken', 'red-meat', 'soup', 'good-to-freeze', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '3c47ea49-8089-43a1-8165-c63087946c1d';
-- 20 Minute Honey Garlic Chicken Udon Noodles
UPDATE meals SET tags = ARRAY['chicken', 'pasta', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '3c5cd24a-50b4-4714-b452-98c39bd6cc98';
-- Cheesy Chicken Nachos (Game Day Must-Have!)
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '409cdb7f-8ed1-447b-b0d6-f7e332bf748d';
-- Cheddar Corn Chowder
UPDATE meals SET tags = ARRAY['barefootcontessa', 'soup', 'red-meat', 'good-to-freeze', 'good-leftovers']::text[] WHERE id = '41086810-1765-4d40-96bf-6561f8127a05';
-- Chicken Stroganoff
UPDATE meals SET tags = ARRAY['chicken', 'good-to-freeze', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '48f8677f-73b8-4195-8caf-a0298e4c3175';
-- Chicken Bacon Green Goddess Ranch Wraps
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'oliviaadriance']::text[] WHERE id = '497dd219-be24-41d5-8e37-5e07336ebcc6';
-- Classic Homemade Meatloaf Recipe
UPDATE meals SET tags = ARRAY['red-meat', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '49b6fd27-0fbb-48ca-bb3f-4b5d796a61c5';
-- Skillet Lasagna
UPDATE meals SET tags = ARRAY['red-meat', 'good-to-freeze', 'pasta', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '4ac21c5e-8527-40c0-aaa1-a2b40fc4b0b1';
-- Beef Bourguignon (Slow Cooker)
UPDATE meals SET tags = ARRAY['crockpot', 'no-dairy', 'red-meat', 'good-to-freeze', 'good-leftovers', 'soup', 'skinnytaste']::text[] WHERE id = '4bc497b1-dd30-49e4-b77e-9037bba7ab07';
-- Crockpot Short Rib Bourguignon
UPDATE meals SET tags = ARRAY['red-meat', 'crockpot', 'soup', 'good-to-freeze', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '4cf268d1-6c67-4f9a-8b2d-1fc3f222308a';
-- Spicy Chipotle Turkey Burritos (Make Ahead)
UPDATE meals SET tags = ARRAY['chicken', 'good-to-freeze', 'good-leftovers', 'pinchofyum']::text[] WHERE id = '4d2176e9-65da-44bf-90e6-a49e8944f287';
-- Tahini Sweet Potato Blondies
UPDATE meals SET tags = ARRAY['vegetarian', 'dessert', 'gluten-free', 'good-to-freeze', 'no-dairy', 'minimalistbaker']::text[] WHERE id = '4d6c0059-0364-4982-8b71-f37a8b018666';
-- Chicken Adobo
UPDATE meals SET tags = ARRAY['chicken', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '4e25da39-7b2a-4282-b77f-05948ccd34b1';
-- Crockpot Beef Stew
UPDATE meals SET tags = ARRAY['red-meat', 'crockpot', 'soup', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '538d26c1-b58d-4b92-945f-3cc03d17affd';
-- Roasted Veggie Grain Bowl with Balsamic Dressing
UPDATE meals SET tags = ARRAY['vegetarian', 'salad', 'good-leftovers', 'pinchofyum']::text[] WHERE id = '541a5ebc-480a-4a13-afde-dcc177680c24';
-- Green Shakshuka
UPDATE meals SET tags = ARRAY['vegetarian', 'breakfast', 'no-dairy', 'gluten-free', 'paleo', 'whole30', 'good-leftovers', 'bonappetit']::text[] WHERE id = '54566d3f-4984-472e-a2a8-df0d983fdbf9';
-- Chicken Tortilla Soup
UPDATE meals SET tags = ARRAY['chicken', 'soup', 'good-to-freeze', 'good-leftovers', 'pinchofyum']::text[] WHERE id = '55c09166-8033-40b4-b233-badb362b04f1';
-- Chicken Lo Mein
UPDATE meals SET tags = ARRAY['chicken', 'pasta', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '55e22afd-0bdd-4996-98cb-095994d91005';
-- Vegetarian Chili
UPDATE meals SET tags = ARRAY['vegetarian', 'soup', 'good-to-freeze', 'good-leftovers', 'no-dairy', 'budgetbytes']::text[] WHERE id = '575c11cd-b740-408f-b357-80cbbe32a0ef';
-- Chicken Tikka Kebab
UPDATE meals SET tags = ARRAY['chicken', 'good-to-freeze', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '595b73b5-07c9-414e-a5f9-0501418a366b';
-- Homemade Mac and Cheese
UPDATE meals SET tags = ARRAY['vegetarian', 'pasta', 'good-leftovers', 'good-to-freeze', 'budgetbytes']::text[] WHERE id = '59d03cf2-84ea-4709-8886-4c5cedc7949f';
-- Sheet Pan Lemon Balsamic Chicken and Potatoes
UPDATE meals SET tags = ARRAY['chicken', 'good-leftovers', 'gluten-free', 'halfbakedharvest']::text[] WHERE id = '5a311293-179e-48aa-9a33-db7b4358f6bd';
-- Chicken Noodle Soup
UPDATE meals SET tags = ARRAY['chicken', 'soup', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '5de050ae-bb76-4e21-9cde-5aab2c78710e';
-- Breakfast Quesadilla (High-Protein)
UPDATE meals SET tags = ARRAY['chicken', 'breakfast', 'skinnytaste']::text[] WHERE id = '61279350-2598-4f52-9db0-f7a6faba75ee';
-- Creamy Cabbage Cucumber and green Apple Salad with Lentils
UPDATE meals SET tags = ARRAY['linecook', 'salad', 'vegetarian', 'no-dairy', 'gluten-free', 'good-leftovers']::text[] WHERE id = '64e18745-9085-47db-b92a-e70155da0a41';
-- The Best Sunday Chili
UPDATE meals SET tags = ARRAY['red-meat', 'soup', 'good-to-freeze', 'good-leftovers', 'crockpot', 'pinchofyum']::text[] WHERE id = '653e0bc4-c8e5-42f0-854d-e1a1f18db34a';
-- Emma Coburn Bibimbap Bowls
UPDATE meals SET tags = ARRAY['red-meat', 'salad', 'good-leftovers', 'coachray']::text[] WHERE id = '65ff62a4-5122-4867-b9f0-ba54d10c2da0';
-- Creamy Sun-Dried Tomato Chicken Pasta
UPDATE meals SET tags = ARRAY['halfbakedharvest', 'chicken', 'pasta', 'good-leftovers']::text[] WHERE id = '6619e111-bfb9-4c10-b659-bd99706ac86e';
-- Slow Cooker Pot Roast
UPDATE meals SET tags = ARRAY['red-meat', 'crockpot', 'good-to-freeze', 'good-leftovers', 'allrecipes']::text[] WHERE id = '66ab19ba-ed0c-4209-90ed-3225f86ddd52';
-- Viral Chuck Roast Tacos
UPDATE meals SET tags = ARRAY['oliviaadriance', 'red-meat', 'crockpot', 'good-to-freeze', 'good-leftovers']::text[] WHERE id = '684f3e56-e329-414d-b22b-7003f491a4e0';
-- Ramen Noodle Salad
UPDATE meals SET tags = ARRAY['chicken', 'salad', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '68bfaf59-d85b-4045-8bdd-ae82a30b1124';
-- Healthy Carrot Cake (GF, DF, Refined Sugar-Free)
UPDATE meals SET tags = ARRAY['vegetarian', 'gluten-free', 'no-dairy', 'dessert', 'good-to-freeze', 'oliviaadriance']::text[] WHERE id = '6a0f5bb4-f499-4661-a932-22fbb6342b96';
-- Fast Easy Oven Chicken Satay
UPDATE meals SET tags = ARRAY['no-dairy', 'good-to-freeze', 'chicken', 'good-leftovers', 'noshingwiththenolands']::text[] WHERE id = '6aa39ac3-646f-4e22-835b-0e9177c55088';
-- One Pot Creamy Cajun Chicken Pasta
UPDATE meals SET tags = ARRAY['chicken', 'pasta', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '6c27ebc0-d274-457a-80e2-a4be5cbffb94';
-- 25 Minute Tzatziki Gyro Rice Bowls
UPDATE meals SET tags = ARRAY['red-meat', 'chicken', 'salad', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '6e443914-798f-4b99-a1ac-14f27811a9aa';
-- Slow Cooker Birria Tacos
UPDATE meals SET tags = ARRAY['red-meat', 'crockpot', 'good-to-freeze', 'good-leftovers', 'soup', 'skinnytaste']::text[] WHERE id = '75e7bacb-86f8-4d79-9672-50c2ac6abe34';
-- Nourishing Cabbage, Fennel & Lentil Soup (1 Pot!)
UPDATE meals SET tags = ARRAY['vegetarian', 'soup', 'no-dairy', 'good-to-freeze', 'good-leftovers', 'minimalistbaker']::text[] WHERE id = '760404be-c069-4f83-83db-ecd84ed1560b';
-- Roasted Sweet Potato Salad with Tahini Dressing
UPDATE meals SET tags = ARRAY['vegetarian', 'salad', 'good-leftovers', 'halfbakedharvest']::text[] WHERE id = '76528ef8-9cdd-4600-9742-91f582a6a1f8';
-- Orecchiette with Brown Butter, Brussels Sprouts & Walnuts
UPDATE meals SET tags = ARRAY['vegetarian', 'pasta', 'good-leftovers', 'alexandracooks']::text[] WHERE id = '784d09a1-1e15-425c-b433-e1e218eecb88';
-- Stuffed Peppers
UPDATE meals SET tags = ARRAY['red-meat', 'good-to-freeze', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '7946585a-8999-467b-a8de-dc1766a218eb';
-- Classic Chili Recipe
UPDATE meals SET tags = ARRAY['red-meat', 'soup', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '7aa7b10b-4ce8-4149-beb1-793c53ce9a21';
-- Crockpot Salsa Verde Chicken Tortilla Bowl
UPDATE meals SET tags = ARRAY['chicken', 'crockpot', 'salad', 'good-leftovers', 'good-to-freeze', 'halfbakedharvest']::text[] WHERE id = '7bf96219-01f7-4b82-8877-ba2ab559ca63';
-- Easy Taco Soup
UPDATE meals SET tags = ARRAY['red-meat', 'soup', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '7c0506c1-a90e-4c40-9544-5ee66655c48b';
-- Fudgy Dark Chocolate Sweet Potato Truffles
UPDATE meals SET tags = ARRAY['vegetarian', 'dessert', 'good-to-freeze', 'minimalistbaker']::text[] WHERE id = '7ec1b7d7-a240-4ef6-81f7-f4129a3a38a0';
-- Creamy Italian White Bean Skillet
UPDATE meals SET tags = ARRAY['vegetarian', 'good-leftovers', 'no-dairy', 'gluten-free', 'minimalistbaker']::text[] WHERE id = '8061e6bc-f4f6-47de-8020-b109511a8c81';
-- Ravioli Soup
UPDATE meals SET tags = ARRAY['chicken', 'soup', 'pasta', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '835c06b3-0e87-417f-a39c-7a9e4788ea2c';
-- Spinach Tortellini Skillet
UPDATE meals SET tags = ARRAY['vegetarian', 'pasta', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '8372f03c-90e8-42a8-9501-13f63ff4bd03';
-- Sheet Pan Chicken Fajitas
UPDATE meals SET tags = ARRAY['chicken', 'no-dairy', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '83f6df68-de19-4a92-81f9-77084f518b44';
-- Easy Minestrone Soup
UPDATE meals SET tags = ARRAY['vegetarian', 'soup', 'good-to-freeze', 'good-leftovers', 'no-dairy', 'budgetbytes']::text[] WHERE id = '8729c68f-043c-47d6-a8c7-722f9c86c6d1';
-- Slow Cooker Vegetarian Lentil Chili
UPDATE meals SET tags = ARRAY['vegetarian', 'crockpot', 'no-dairy', 'soup', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '88972943-23a7-4c1d-bbdb-da5f13023d48';
-- Easy Homemade Meatballs
UPDATE meals SET tags = ARRAY['red-meat', 'good-to-freeze', 'good-leftovers', 'budgetbytes']::text[] WHERE id = '897a8b84-c8fa-416b-9e97-0e318c32201e';
-- Slow Cooker Korean Beef
UPDATE meals SET tags = ARRAY['red-meat', 'crockpot', 'good-to-freeze', 'good-leftovers', 'skinnytaste']::text[] WHERE id = '8982281c-ecbb-4624-a584-9b296cf8330f';

-- 2) Flip every meal to public.
UPDATE meals SET is_public = true WHERE is_public IS DISTINCT FROM true;

COMMIT;
