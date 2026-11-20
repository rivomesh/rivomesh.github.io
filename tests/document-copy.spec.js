import {expect,it} from 'vitest'
import fs from 'node:fs/promises'
import {documentCopy} from '../tooling/document-copy.mjs'
it('keeps private execution notes out of imported pages while retaining technical reference links',async()=>{
 const archived=await fs.readFile('quality/archive/development-v3.md','utf8')
 expect(archived).toContain('Active goal remains ACTIVE')
 const published=documentCopy({sourcePath:'docs/development-v3.md',locale:'zh'},archived)
 expect(published).not.toMatch(/Active goal|No delegation|Workdir|Preserve user root TODO|Noagents\/nocommits|Nextturn|\/Users\//)
 expect(published).toContain('/docs/zh/reference/pipeline-v3.html')
 expect(published).toContain('/docs/zh/start/verification.html')
 expect(published).toContain('/docs/zh/reference/implementation-status.html')
})
