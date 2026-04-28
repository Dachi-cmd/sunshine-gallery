INSERT INTO public.site_settings (key, value) VALUES
  ('home_kicker_en', 'Selected works · 2018 — 2024'),
  ('home_kicker_ka', 'რჩეული ნამუშევრები · 2018 — 2024'),
  ('home_title_en', E'Paintings of stillness,\nweight, and light.'),
  ('home_title_ka', E'მშვიდობის, სიმძიმის\nდა სინათლის მხატვრობა.'),
  ('home_subtitle_en', 'A studio practice rooted in oil and patience — figures, landscapes, and quiet still lifes made over slow seasons in Tbilisi.'),
  ('home_subtitle_ka', 'სტუდიური პრაქტიკა, დაფუძნებული ზეთზე და მოთმინებაზე — ფიგურები, პეიზაჟები და მშვიდი ნატურმორტები, შექმნილი ნელ სეზონებში თბილისში.'),
  ('about_kicker_en', 'About the Artist'),
  ('about_kicker_ka', 'მხატვრის შესახებ'),
  ('about_title_en', 'Davit Abramishvili'),
  ('about_title_ka', 'დავით აბრამიშვილი'),
  ('chat_knowledge_en', E'Pricing: Each artwork in the Gallery and Shop has its own price. Prices are shown in USD by default, GEL when Georgian is selected.\nLocation: Based in Tbilisi, Georgia. Studio visits by appointment.\nPurchasing: Browse the Gallery or Shop, click an artwork, then use "Add to Cart" or "Inquire on WhatsApp". Checkout is completed via WhatsApp.\nDelivery: Worldwide shipping available. Final shipping cost and timing are confirmed via WhatsApp after inquiry.\nContact: Reach out via WhatsApp or the contact links in the footer.'),
  ('chat_knowledge_ka', E'ფასები: გალერეაში და მაღაზიაში თითოეულ ნამუშევარს აქვს თავისი ფასი. სტანდარტულად USD, ქართული ენის არჩევისას GEL.\nმდებარეობა: თბილისი, საქართველო. სტუდიის მონახულება წინასწარი შეთანხმებით.\nშეძენა: აირჩიეთ ნამუშევარი გალერეაში ან მაღაზიაში, შემდეგ გამოიყენეთ "კალათაში დამატება" ან "შეკითხვა WhatsApp-ით".\nმიწოდება: ვაგზავნით მსოფლიოს ნებისმიერ წერტილში. ფასი და ვადები ზუსტდება WhatsApp-ით.\nკონტაქტი: დაგვიკავშირდით WhatsApp-ით ან ფუტერში მოცემული კონტაქტებით.'),
  ('chat_qas', '[
    {"q_en":"How much does it cost?","q_ka":"რამდენი ღირს?","a_en":"Each artwork has its own price. Click any piece in the Gallery or Shop to see pricing. Prices display in USD, or GEL when Georgian is selected.","a_ka":"თითოეულ ნამუშევარს აქვს თავისი ფასი. დააკლიკეთ ნამუშევარს გალერეაში ან მაღაზიაში. ფასი ნაჩვენებია USD-ში, ქართულად — GEL-ში."},
    {"q_en":"Where are you located?","q_ka":"სად მდებარეობთ?","a_en":"The studio is based in Tbilisi, Georgia. Visits are welcomed by appointment — reach out on WhatsApp to arrange.","a_ka":"სტუდია მდებარეობს თბილისში, საქართველოში. მონახულება შესაძლებელია წინასწარი შეთანხმებით WhatsApp-ით."},
    {"q_en":"How can I purchase an artwork?","q_ka":"როგორ შევიძინო ნამუშევარი?","a_en":"Browse the Gallery or Shop, open the piece you like, then use Add to Cart or Inquire on WhatsApp. Checkout is finalised through WhatsApp.","a_ka":"აირჩიეთ ნამუშევარი გალერეაში ან მაღაზიაში, გახსენით და გამოიყენეთ კალათაში დამატება ან WhatsApp-ით შეკითხვა."},
    {"q_en":"Delivery","q_ka":"მიწოდება","a_en":"We ship worldwide. Artworks are carefully packed; final shipping cost and timing are confirmed on WhatsApp after your inquiry.","a_ka":"ვაგზავნით მსოფლიოს ნებისმიერ წერტილში. ზუსტი ღირებულება და ვადები ზუსტდება WhatsApp-ით."},
    {"q_en":"Contact","q_ka":"კონტაქტი","a_en":"The fastest way to reach the artist is via WhatsApp — you''ll also find email and socials in the footer.","a_ka":"ყველაზე სწრაფი გზა — WhatsApp. ასევე იხილეთ ელფოსტა და სოციალური ქსელები ფუტერში."}
  ]'::text)
ON CONFLICT (key) DO NOTHING;