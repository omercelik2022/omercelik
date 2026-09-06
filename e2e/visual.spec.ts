import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
const token=readFileSync('data/setup-token.txt','utf8').trim();
test('setup, dashboard and responsive views are usable',async({page})=>{
 mkdirSync('docs/screenshots',{recursive:true});
 await page.goto('/');await expect(page.getByRole('heading',{name:'Atölyenizi kurun.'})).toBeVisible();
 await page.getByLabel('Kurulum kodu').fill(token);await page.getByLabel('Adınız').fill('Ömer');await page.getByLabel('E-posta adresi').fill('omer@atolye.test');await page.getByLabel('Parola').fill('güvenli-test-parolası');await page.getByRole('button',{name:'Özel atölyeyi oluştur'}).click();
 await expect(page.getByRole('heading',{name:'Merhaba, Ömer.'})).toBeVisible();await page.screenshot({path:'docs/screenshots/dashboard-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Yeni Proje'}).first().click();await expect(page.getByRole('heading',{name:'Projenizi tanıyalım'})).toBeVisible();await page.screenshot({path:'docs/screenshots/project-wizard-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.reload();await expect(page.getByRole('heading',{name:'Merhaba, Ömer.'})).toBeVisible();await expect(page.getByRole('button',{name:'Menüyü aç'})).toBeVisible();await page.screenshot({path:'docs/screenshots/dashboard-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Menüyü aç'}).click();await expect(page.getByRole('navigation',{name:'Ana menü'})).toBeVisible();
});
