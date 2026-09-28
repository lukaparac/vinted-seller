# Vinted Seller APP

Create a completely separate Lovable project called "Vinted Seller OS" — an AI-assisted resale listing workspace for Vinted sellers.

IMPORTANT PRODUCT POSITIONING:
- This is NOT a Vinted bot and must NOT scrape Vinted, automate clicks, bypass protections, use session cookies, or auto-publish to Vinted.
- Build a compliant human-in-the-loop workflow: AI prepares listings, the user reviews/edits/approves, and the app provides copy/export tools for manual publication.
- The architecture should be extensible later for officially authorized marketplace integrations, but do not implement unauthorized Vinted API/browser automation.

MVP GOAL:
Turn product photos into high-quality, Vinted-ready listings with pricing guidance and inventory management.

CORE UX:
1. Dashboard
   - KPI cards: Drafts, Ready to Publish, Active, Sold, Estimated Inventory Value
   - Recent items
   - "Add item" primary CTA
   - clean premium editorial/e-commerce aesthetic, desktop first but responsive on mobile
2. Add Item
   - drag/drop or file upload for multiple photos
   - create one item per upload batch
   - fields for optional manual hints: brand, category, size, condition, purchase cost
   - button "Analyze with AI"
3. AI Listing Workspace
   - image gallery
   - AI-detected fields: brand, model/type, category, subcategory, color, material, size, condition, visible flaws
   - confidence indicators
   - editable fields
   - generated Vinted title
   - generated description in Croatian
   - keywords
   - pricing guidance: recommended price, quick-sale price, minimum acceptable price
   - rationale for pricing
   - buttons: Regenerate, Save Draft, Approve Listing
4. Inventory
   - table/grid with SKU, title, brand, category, cost, price, status, date added
   - statuses: Draft, Ready, Listed, Reserved, Sold, Shipped
   - filters and search
   - bulk status changes
5. Listing detail
   - all photos and listing data
   - copy title button
   - copy description button
   - copy all listing data button
   - export listing as CSV/JSON
   - edit history
6. Pricing Research
   - separate area for future web-research integration
   - for MVP create the data model and UI for comparable listings, source URL, observed price, date checked, notes
   - clearly label research as market guidance, not guaranteed sale price
7. Settings
   - seller profile
   - default currency EUR
   - default language Croatian
   - default listing style/tone
   - pricing preferences

DATA MODEL:
- users/profile
- items
- item_images
- listings
- pricing_research
- listing_versions
- activity_log

SKU FORMAT:
LP-VNT-0001, increment automatically.

DESIGN:
- premium minimalist resale/e-commerce SaaS
- dark charcoal/black + warm neutral/white interface
- strong typography, lots of whitespace
- cards with subtle borders, restrained shadows
- polished enough to look like a real commercial SaaS, not a prototype
- navigation: Dashboard / Add Item / Inventory / Research / Settings
- use shadcn/ui and Tailwind
- accessible components and responsive layouts

TECHNICAL:
- Use Lovable's default full-stack TypeScript stack.
- Enable Supabase/Postgres database.
- Add authentication so the workspace is private to the user.
- Create sensible database tables and relationships.
- Seed a few demo items so the UI is immediately understandable.
- AI functionality should initially be implemented through a clean service abstraction/mock provider so it can later be connected to an AI vision/model API without rewriting the UI.
- Web research should similarly use a service abstraction.
- Never expose secrets in frontend code.
- Add loading, empty, error and success states.
- Add validation.
- Make all copy in Croatian, except product name "Vinted Seller OS" and standard technical terms where natural.

IMPORTANT:
Do not overbuild. Prioritize a beautiful, functional MVP that can actually be used to create and manage listings. Do not add payments, teams, social features, or marketplace auto-posting in v1.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vinted-seller.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/35860db1-4dca-4f42-80f1-8d7da9766fc7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
