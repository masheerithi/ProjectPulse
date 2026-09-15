// No module uses seeded/local demo data anymore — every screen reads and
// writes real SQL through src/api/flows.js (flow1/FLOW_URL for the
// original 17 tables, flow2/NEW_FLOW_URL for the gap-closure tables).
// This file is kept only so old imports don't 404 mid-refactor; it can be
// deleted once you've confirmed nothing else references it.