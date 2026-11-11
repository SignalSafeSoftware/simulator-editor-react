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
 await page.getByRole('tab',{name:'Simulator',exact:true}).click();
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
