'use strict';
// Netlify: exit 0 skips a build; exit 1 allows it.
const preview=['deploy-preview','branch-deploy'].includes(process.env.CONTEXT);
process.exit(preview?1:0);
