import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private db: DatabaseService) {}

  async onApplicationBootstrap() {
    await this.seedOrRefreshData();
  }

  /**
   * Refreshes all listing deadlines relative to the exact current time.
   * Ensures that whenever the application is restarted, all countdown timers start fresh!
   */
  async refreshListingDeadlines() {
    const now = new Date();
    this.logger.log(`Refreshing all surplus food deadlines relative to current time: ${now.toLocaleTimeString()}`);

    const offsets: { [id: string]: number } = {
      list_batch_1: 2.5,
      list_batch_2: 1.2, // Urgent (<90m)
      list_batch_3: 3.0,
      list_batch_4: 4.0,
      list_batch_5: 5.0,
      list_batch_6: 6.5,
      list_batch_7: 1.8, // Urgent (<90m)
      list_batch_8: 1.1, // Urgent (<90m)
      list_batch_9: 2.8,
      list_batch_10: 4.5,
      list_batch_11: 1.5,
      list_batch_12: 3.2,
      list_batch_13: 2.2,
      list_batch_14: 3.8,
    };

    for (const [id, hoursAhead] of Object.entries(offsets)) {
      const deadline = new Date(now.getTime() + hoursAhead * 3600 * 1000).toISOString();
      await this.db.query(
        `UPDATE listings SET 
          pickup_start = ?, 
          pickup_deadline = ?,
          status = CASE WHEN id = 'list_batch_4' THEN 'CLAIMED' ELSE 'AVAILABLE' END,
          updated_at = ?
         WHERE id = ?`,
        [now.toISOString(), deadline, now.toISOString(), id]
      );
    }

    this.logger.log('All listing countdown timers successfully refreshed to fresh demo state!');
  }

  private async seedOrRefreshData() {
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);
    const now = new Date();

    const baseLat = 12.9716;
    const baseLng = 77.5946;

    // Check if users already seeded
    const usersCount = await this.db.query('SELECT COUNT(*) as count FROM users');
    if (Number(usersCount.rows[0]?.count || 0) === 0) {
      this.logger.log('Seeding initial users...');
      const users = [
        {
          id: 'usr_admin_1',
          email: 'admin@harvestrelay.org',
          name: 'Hritik',
          role: 'ADMIN',
          org_name: 'Metropolitan Food Coalition',
          org_type: 'COALITION_ADMIN',
          phone: '+91 98860 11000',
          address: 'Civic Center, Central Boulevard',
          latitude: baseLat,
          longitude: baseLng,
        },
        {
          id: 'usr_vendor_1',
          email: 'baker@sourdoughloft.com',
          name: 'Devansh Tomar',
          role: 'VENDOR',
          org_name: 'The Sourdough Loft',
          org_type: 'BAKERY',
          phone: '+91 98860 22001',
          address: '42 Artisanal Way, Indiranagar',
          latitude: baseLat + 0.008,
          longitude: baseLng + 0.012,
        },
        {
          id: 'usr_vendor_2',
          email: 'kitchen@greenbowl.io',
          name: 'Amina Farooq',
          role: 'VENDOR',
          org_name: 'Green Bowl Organics',
          org_type: 'CAFE',
          phone: '+91 98860 22002',
          address: '15 Leafy Lane, Koramangala',
          latitude: baseLat - 0.011,
          longitude: baseLng + 0.007,
        },
        {
          id: 'usr_vendor_3',
          email: 'manager@malabarspices.com',
          name: 'Rajesh Nair',
          role: 'VENDOR',
          org_name: 'Malabar Heritage Bistro',
          org_type: 'RESTAURANT',
          phone: '+91 98860 22003',
          address: '88 Spice Route, MG Road',
          latitude: baseLat + 0.003,
          longitude: baseLng - 0.009,
        },
        {
          id: 'usr_vendor_4',
          email: 'dining@campuscommons.edu',
          name: 'Prof. David Chen',
          role: 'VENDOR',
          org_name: 'Campus Commons Cafeteria',
          org_type: 'CAFETERIA',
          phone: '+91 98860 22004',
          address: 'University Quad Dining Hall',
          latitude: baseLat - 0.006,
          longitude: baseLng - 0.014,
        },
        {
          id: 'usr_recipient_1',
          email: 'director@secondharvest.org',
          name: 'Kamakshi Singh',
          role: 'RECIPIENT',
          org_name: 'Second Harvest Community Kitchen',
          org_type: 'COMMUNITY_KITCHEN',
          phone: '+91 98860 33001',
          address: '104 Outreach Avenue, Richmond Town',
          latitude: baseLat - 0.004,
          longitude: baseLng + 0.005,
        },
        {
          id: 'usr_recipient_2',
          email: 'shelter@hopehaven.org',
          name: 'Tariq Al-Mansoor',
          role: 'RECIPIENT',
          org_name: 'Hope Haven Youth Shelter',
          org_type: 'NGO_SHELTER',
          phone: '+91 98860 33002',
          address: '22 Beacon Street, Frazer Town',
          latitude: baseLat + 0.015,
          longitude: baseLng - 0.002,
        },
        {
          id: 'usr_recipient_3',
          email: 'rescue@studentnetwork.org',
          name: 'Sagnik Goswami',
          role: 'RECIPIENT',
          org_name: 'Student Food Rescue Alliance',
          org_type: 'VOLUNTEER',
          phone: '+91 98860 33003',
          address: 'Student Union Hub, North Campus',
          latitude: baseLat + 0.005,
          longitude: baseLng + 0.018,
        },
      ];

      for (const u of users) {
        await this.db.query(
          `INSERT INTO users (id, email, password_hash, name, role, org_name, org_type, phone, address, latitude, longitude, verified, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          [u.id, u.email, defaultPasswordHash, u.name, u.role, u.org_name, u.org_type, u.phone, u.address, u.latitude, u.longitude, now.toISOString()]
        );
      }
    }

    // Helper for initial future ISO timestamps
    const futureDate = (hoursAhead: number) => {
      return new Date(now.getTime() + hoursAhead * 60 * 60 * 1000).toISOString();
    };

    // Full catalog of 14 realistic food entries
    const fullListings = [
      {
        id: 'list_batch_1',
        vendor_id: 'usr_vendor_1',
        title: 'Artisanal Country Sourdough, Baguettes & Brioche Pastries',
        description: 'Freshly baked this morning; end-of-day unsold stock. Crisp crust, tender crumb, perfect for community dinner distribution. Packaged in dry kraft bakery cartons.',
        category: 'BAKERY',
        quantity: 35,
        unit: 'portions',
        portion_estimate: 40,
        dietary_flags: JSON.stringify(['Vegetarian', 'Vegan', 'Dairy-Free']),
        safe_temperature: 'ROOM',
        packaging_type: 'BAKERY_BOXES',
        allergen_info: 'Contains wheat gluten. Prepared in a facility handling walnuts.',
        address: '42 Artisanal Way, Indiranagar',
        latitude: baseLat + 0.008,
        longitude: baseLng + 0.012,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(2.5),
        status: 'AVAILABLE',
        handover_pin: '4821',
        notes: 'Ring side service door for loading access directly into cargo bike or van.',
      },
      {
        id: 'list_batch_2',
        vendor_id: 'usr_vendor_2',
        title: 'Quinoa Veggie Grain Bowls & Roasted Chickpea Salads',
        description: 'Chef-prepared organic grain bowls with tahini dressing, steamed edamame, and roast root vegetables. Fully sealed in compostable airtight deli containers, refrigerated at 4°C.',
        category: 'COOKED_MEALS',
        quantity: 28,
        unit: 'portions',
        portion_estimate: 28,
        dietary_flags: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal']),
        safe_temperature: 'REFRIGERATED',
        packaging_type: 'SEALED_CONTAINERS',
        allergen_info: 'Sesame dressing in separate side pods. Gluten-free certification.',
        address: '15 Leafy Lane, Koramangala',
        latitude: baseLat - 0.011,
        longitude: baseLng + 0.007,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(1.2),
        status: 'AVAILABLE',
        handover_pin: '7392',
        notes: 'Please bring insulated thermal bags or cold cooler for transport.',
      },
      {
        id: 'list_batch_3',
        vendor_id: 'usr_vendor_3',
        title: 'Fragrant Vegetable Dum Biryani & Butter Naan Baskets',
        description: 'Surplus from banquet catering prepared at 1:30 PM. Kept under commercial steam table heating at 68°C. Heavy stainless warming pans, ready to decant into recipient food containers.',
        category: 'COOKED_MEALS',
        quantity: 50,
        unit: 'portions',
        portion_estimate: 55,
        dietary_flags: JSON.stringify(['Vegetarian', 'Halal']),
        safe_temperature: 'HEATED',
        packaging_type: 'THERMAL_TRAYS',
        allergen_info: 'Contains dairy (ghee/paneer) and cashew nuts.',
        address: '88 Spice Route, MG Road',
        latitude: baseLat + 0.003,
        longitude: baseLng - 0.009,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(3.0),
        status: 'AVAILABLE',
        handover_pin: '1904',
        notes: 'Recipient must bring sturdy containers or food grade tubs.',
      },
      {
        id: 'list_batch_4',
        vendor_id: 'usr_vendor_4',
        title: 'Creamy Tomato Fusilli Pasta & Garlic Breadsticks',
        description: 'Lunch service over-preparation from student cafeteria. Wholesome durum wheat pasta with herb marinara sauce and parmesan.',
        category: 'COOKED_MEALS',
        quantity: 45,
        unit: 'portions',
        portion_estimate: 45,
        dietary_flags: JSON.stringify(['Vegetarian', 'Nut-Free']),
        safe_temperature: 'HEATED',
        packaging_type: 'FOIL_TRAYS',
        allergen_info: 'Contains wheat gluten and milk/parmesan.',
        address: 'University Quad Dining Hall',
        latitude: baseLat - 0.006,
        longitude: baseLng - 0.014,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(4.0),
        status: 'CLAIMED',
        handover_pin: '6155',
        notes: 'Claimed by Second Harvest. Handover scheduled for 4:00 PM.',
      },
      {
        id: 'list_batch_5',
        vendor_id: 'usr_vendor_1',
        title: 'Organic Whole Milk Yogurts & Sliced Cheddar Packs',
        description: 'Supermarket partner consignment nearing best-before window (3 days left). Unopened, commercially sealed, 100% sound refrigeration history.',
        category: 'DAIRY',
        quantity: 20,
        unit: 'kg',
        portion_estimate: 50,
        dietary_flags: JSON.stringify(['Vegetarian', 'Gluten-Free']),
        safe_temperature: 'REFRIGERATED',
        packaging_type: 'COMMERCIAL_PACKS',
        allergen_info: 'Contains cow dairy/lactose.',
        address: '42 Artisanal Way, Indiranagar',
        latitude: baseLat + 0.008,
        longitude: baseLng + 0.012,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(5.0),
        status: 'AVAILABLE',
        handover_pin: '8240',
        notes: 'Chilled store pickup. Ask for Duty Manager at reception.',
      },
      {
        id: 'list_batch_6',
        vendor_id: 'usr_vendor_2',
        title: 'Golden Delicious Apples, Pears & Fresh Spinach Crates',
        description: 'Farm fresh surplus produce boxes with slight surface blemishes. Ideal for salad prep, juicing, or family grocery parcels.',
        category: 'PRODUCE',
        quantity: 30,
        unit: 'kg',
        portion_estimate: 60,
        dietary_flags: JSON.stringify(['Vegan', 'Raw', 'Gluten-Free', 'Organic']),
        safe_temperature: 'ROOM',
        packaging_type: 'WOODEN_CRATES',
        allergen_info: 'Pure unadulterated fruit & vegetables.',
        address: '15 Leafy Lane, Koramangala',
        latitude: baseLat - 0.011,
        longitude: baseLng + 0.007,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(6.5),
        status: 'AVAILABLE',
        handover_pin: '3318',
        notes: 'Loading bay B open until 8 PM.',
      },
      {
        id: 'list_batch_7',
        vendor_id: 'usr_vendor_1',
        title: 'Freshly Baked Everything Bagels, Croissants & Cream Cheese Tubs',
        description: 'End-of-day cafe surplus. Includes 24 assorted NY-style seeded bagels and whipped herb cream cheese tubs. Ready for immediate breakfast or dinner distribution.',
        category: 'BAKERY',
        quantity: 30,
        unit: 'portions',
        portion_estimate: 35,
        dietary_flags: JSON.stringify(['Vegetarian', 'Nut-Free']),
        safe_temperature: 'ROOM',
        packaging_type: 'BAKERY_BOXES',
        allergen_info: 'Contains wheat gluten, sesame seeds, and cow dairy.',
        address: '42 Artisanal Way, Indiranagar',
        latitude: baseLat + 0.008,
        longitude: baseLng + 0.012,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(1.8),
        status: 'AVAILABLE',
        handover_pin: '5512',
        notes: 'Please collect before evening shop lockup at 7:30 PM.',
      },
      {
        id: 'list_batch_8',
        vendor_id: 'usr_vendor_3',
        title: 'Wood-Fired Margherita & Roasted Bell Pepper Pizza Slices',
        description: 'Pizzeria lunch surplus. Slices kept warm under heated display lamps. Packed in clean stackable pizza boxes.',
        category: 'COOKED_MEALS',
        quantity: 32,
        unit: 'portions',
        portion_estimate: 32,
        dietary_flags: JSON.stringify(['Vegetarian', 'Halal']),
        safe_temperature: 'HEATED',
        packaging_type: 'FOIL_TRAYS',
        allergen_info: 'Contains wheat gluten and mozzarella dairy.',
        address: '88 Spice Route, MG Road',
        latitude: baseLat + 0.003,
        longitude: baseLng - 0.009,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(1.1), // Urgent!
        status: 'AVAILABLE',
        handover_pin: '9034',
        notes: 'Urgent pickup requested. Pizza warming lamps turn off soon.',
      },
      {
        id: 'list_batch_9',
        vendor_id: 'usr_vendor_3',
        title: 'South Indian Meal Thali Boxes (Sambar, Veg Poriyal & Steamed Rice)',
        description: 'Nutritious full meals prepared by catering kitchen. Individual sealed meal trays with hot sambar, seasonal vegetable poriyal, and fragrant basmati rice.',
        category: 'COOKED_MEALS',
        quantity: 40,
        unit: 'portions',
        portion_estimate: 40,
        dietary_flags: JSON.stringify(['Vegetarian', 'Vegan', 'Gluten-Free']),
        safe_temperature: 'HEATED',
        packaging_type: 'SEALED_CONTAINERS',
        allergen_info: 'Mustard seeds in tempering. 100% nut-free and dairy-free.',
        address: '88 Spice Route, MG Road',
        latitude: baseLat + 0.003,
        longitude: baseLng - 0.009,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(2.8),
        status: 'AVAILABLE',
        handover_pin: '6741',
        notes: 'Hot food crates available for easier transfer.',
      },
      {
        id: 'list_batch_10',
        vendor_id: 'usr_vendor_2',
        title: 'Organic Alphonso Mangoes, Papayas & Fresh Mint Bunches',
        description: 'Ripe seasonal fruit surplus from organic juice cooperative. Perfect for fresh community snack distribution or community kitchen smoothies.',
        category: 'PRODUCE',
        quantity: 25,
        unit: 'kg',
        portion_estimate: 50,
        dietary_flags: JSON.stringify(['Vegan', 'Raw', 'Gluten-Free', 'Organic']),
        safe_temperature: 'ROOM',
        packaging_type: 'WOODEN_CRATES',
        allergen_info: 'Pure natural fruit produce.',
        address: '15 Leafy Lane, Koramangala',
        latitude: baseLat - 0.011,
        longitude: baseLng + 0.007,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(4.5),
        status: 'AVAILABLE',
        handover_pin: '2819',
        notes: 'Loading dock at rear of cafe.',
      },
      {
        id: 'list_batch_11',
        vendor_id: 'usr_vendor_4',
        title: 'Paneer Tikka & Grilled Vegetable Club Sandwiches',
        description: 'Cafeteria takeaway wraps and triple-layer sandwiches. Packed in parchment paper wrapping with sealed dates.',
        category: 'COOKED_MEALS',
        quantity: 30,
        unit: 'portions',
        portion_estimate: 30,
        dietary_flags: JSON.stringify(['Vegetarian']),
        safe_temperature: 'REFRIGERATED',
        packaging_type: 'SEALED_CONTAINERS',
        allergen_info: 'Contains dairy (cottage cheese/paneer) and wheat gluten.',
        address: 'University Quad Dining Hall',
        latitude: baseLat - 0.006,
        longitude: baseLng - 0.014,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(1.5),
        status: 'AVAILABLE',
        handover_pin: '4488',
        notes: 'Collect from campus student service desk.',
      },
      {
        id: 'list_batch_12',
        vendor_id: 'usr_vendor_2',
        title: 'Greek Yogurt Cups with Honey, Chia & Almond Granola',
        description: 'Unopened artisan chilled yogurt jars prepared this morning. Rich protein content, cold-stored at 3°C.',
        category: 'DAIRY',
        quantity: 18,
        unit: 'kg',
        portion_estimate: 35,
        dietary_flags: JSON.stringify(['Vegetarian', 'Gluten-Free']),
        safe_temperature: 'REFRIGERATED',
        packaging_type: 'SEALED_CONTAINERS',
        allergen_info: 'Contains dairy and roasted almonds.',
        address: '15 Leafy Lane, Koramangala',
        latitude: baseLat - 0.011,
        longitude: baseLng + 0.007,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(3.2),
        status: 'AVAILABLE',
        handover_pin: '7105',
        notes: 'Bring insulated cold carrier.',
      },
      {
        id: 'list_batch_13',
        vendor_id: 'usr_vendor_3',
        title: 'Vegetable Hakka Noodles & Crispy Spring Roll Trays',
        description: 'Asian banquet buffet surplus. Wok-tossed noodles with cabbage, carrots, bell peppers, and scallions in catering warming foil pans.',
        category: 'COOKED_MEALS',
        quantity: 45,
        unit: 'portions',
        portion_estimate: 45,
        dietary_flags: JSON.stringify(['Vegetarian', 'Vegan', 'Halal']),
        safe_temperature: 'HEATED',
        packaging_type: 'FOIL_TRAYS',
        allergen_info: 'Contains soy sauce and wheat noodles.',
        address: '88 Spice Route, MG Road',
        latitude: baseLat + 0.003,
        longitude: baseLng - 0.009,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(2.2),
        status: 'AVAILABLE',
        handover_pin: '8361',
        notes: 'Front counter manager will assist with handover.',
      },
      {
        id: 'list_batch_14',
        vendor_id: 'usr_vendor_1',
        title: 'Whole Grain Rye Batards & Rosemary Sea Salt Focaccia',
        description: 'Artisan baker batch overage. Golden crust loaves with aromatic herbs, perfect for dinner table portions.',
        category: 'BAKERY',
        quantity: 26,
        unit: 'portions',
        portion_estimate: 30,
        dietary_flags: JSON.stringify(['Vegetarian', 'Vegan']),
        safe_temperature: 'ROOM',
        packaging_type: 'BAKERY_BOXES',
        allergen_info: 'Contains rye and wheat gluten.',
        address: '42 Artisanal Way, Indiranagar',
        latitude: baseLat + 0.008,
        longitude: baseLng + 0.012,
        pickup_start: now.toISOString(),
        pickup_deadline: futureDate(3.8),
        status: 'AVAILABLE',
        handover_pin: '3940',
        notes: 'Available until bakery closing time.',
      },
    ];

    for (const l of fullListings) {
      // Upsert: insert or update if already exists
      const existing = await this.db.query('SELECT id FROM listings WHERE id = ?', [l.id]);
      if (existing.rows.length === 0) {
        await this.db.query(
          `INSERT INTO listings (
            id, vendor_id, title, description, category, quantity, unit,
            portion_estimate, dietary_flags, safe_temperature, packaging_type,
            allergen_info, address, latitude, longitude, pickup_start,
            pickup_deadline, status, handover_pin, notes, food_safety_acknowledged,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            l.id,
            l.vendor_id,
            l.title,
            l.description,
            l.category,
            l.quantity,
            l.unit,
            l.portion_estimate,
            l.dietary_flags,
            l.safe_temperature,
            l.packaging_type,
            l.allergen_info,
            l.address,
            l.latitude,
            l.longitude,
            l.pickup_start,
            l.pickup_deadline,
            l.status,
            l.handover_pin,
            l.notes,
            now.toISOString(),
            now.toISOString(),
          ]
        );
      }
    }

    // Refresh all deadlines relative to now
    await this.refreshListingDeadlines();

    // Ensure custom team names are updated in existing database records
    await this.db.query("UPDATE users SET name = 'Hritik' WHERE id = 'usr_admin_1'");
    await this.db.query("UPDATE users SET name = 'Devansh Tomar' WHERE id = 'usr_vendor_1'");
    await this.db.query("UPDATE users SET name = 'Kamakshi Singh' WHERE id = 'usr_recipient_1'");
    await this.db.query("UPDATE users SET name = 'Sagnik Goswami' WHERE id = 'usr_recipient_3'");

    this.logger.log('Database initialized with 14 diverse surplus batches with fresh timers!');
  }
}
