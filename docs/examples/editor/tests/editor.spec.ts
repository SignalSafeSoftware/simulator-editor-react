import {test,expect} from '@playwright/test';
test('provides reciprocal source links and updates a selected conversation preview',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await expect(page.getByRole('link',{name:'Repository',exact:true})).toHaveAttribute('href','https://github.com/SignalSafeSoftware/simulator-editor-react');
 await expect(page.getByRole('link',{name:'Device demo',exact:true})).toHaveAttribute('href','https://signalsafesoftware.github.io/simulator-device/');
 await page.getByRole('treeitem',{name:'Sam Example',exact:true}).click();
 await expect(page.getByRole('complementary',{name:'Live simulator preview'})).toContainText('Let us verify the sender');
 await page.getByRole('tab',{name:'JSON',exact:true}).click();
 await expect(page.getByLabel('Simulator content JSON')).toContainText('conversation-sam');
 await page.getByRole('tab',{name:'Preview',exact:true}).click();
 await page.getByRole('button',{name:'Reset example',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Contact name',exact:true})).toHaveValue('Alex Example');
 expect(errors).toEqual([]);
});
test('selects and edits a contact through the editor without persistence',async({page})=>{
 await page.goto('/');
 await page.getByRole('navigation',{name:'Simulator content sections'}).getByRole('button',{name:'Contacts',exact:true}).click();
 await page.getByRole('region',{name:'Contacts panel'}).getByRole('button',{name:'Sam Example',exact:true}).click();
 await page.getByLabel('First name',{exact:true}).fill('Taylor');
 await expect(page.getByRole('complementary',{name:'Live simulator preview'})).toContainText('Taylor Example');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download section data'}).click();expect((await download).suggestedFilename()).toBe('simulator-editor-sections.json');
});
test('retains invalid JSON for repair instead of accepting it silently',async({page})=>{
 await page.goto('/');await page.getByRole('tab',{name:'JSON',exact:true}).click();
 const input=page.getByLabel('Simulator content JSON');await input.fill('[');
 await expect(input).toHaveValue('[');await expect(page.getByRole('button',{name:'Download section data'})).toBeDisabled();
});

test('renders the package-owned phone frame and icon font',async({page})=>{
 await page.goto('/');
 const shell=page.getByTestId('simulator-device-shell');
 await expect(shell).toBeVisible();
 const geometry=await page.locator('.simulator-root.simulator-host-device').evaluate(element=>{const style=getComputedStyle(element),box=element.getBoundingClientRect();return {radius:style.borderRadius,width:box.width,height:box.height,background:style.backgroundColor};});
 expect(geometry.radius).toBe('38px');expect(geometry.width).toBeGreaterThan(300);expect(geometry.height).toBeGreaterThan(600);expect(geometry.background).not.toBe('rgba(0, 0, 0, 0)');
 await expect(page.locator('.simulator-root.simulator-host-device')).toHaveCount(1);
 await page.evaluate(()=>document.fonts.ready);expect(await page.evaluate(()=>document.fonts.check('16px bootstrap-icons'))).toBe(true);
});

test('keeps metadata and conversation selection across the unified tabs', async ({page}) => {
 await page.goto('/');
 await expect(page.getByRole('tablist',{name:'Simulator content views'}).getByRole('tab')).toHaveText(['Properties','Preview','JSON']);
 await page.getByRole('treeitem',{name:'Sam Example',exact:true}).click();
 await page.getByRole('tab',{name:'Properties',exact:true}).click();
 await page.getByLabel('Simulator name',{exact:true}).fill('Authored example');
 await page.getByRole('tab',{name:'JSON',exact:true}).click();
 await page.getByRole('tab',{name:'Preview',exact:true}).click();
 await expect(page.getByRole('complementary',{name:'Live simulator preview'})).toContainText('Let us verify the sender');
 await page.getByRole('tab',{name:'Properties',exact:true}).click();
 await expect(page.getByLabel('Simulator name',{exact:true})).toHaveValue('Authored example');
});
