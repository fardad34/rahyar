'use strict';
const {spawnSync}=require('node:child_process');
if(!['deploy-preview','branch-deploy'].includes(process.env.CONTEXT) || ['main','master'].includes(process.env.BRANCH)) {
 console.error('Rahyar Netlify configuration is staging-only. Production/main builds are blocked.');process.exit(1);
}
const result=spawnSync(process.execPath,['scripts/build.cjs'],{stdio:'inherit'});
process.exit(result.status??1);
