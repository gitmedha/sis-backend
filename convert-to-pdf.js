const puppeteer = require('puppeteer');
const path = require('path'); // Import the path module to handle file paths

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Construct the absolute file path
    const filePath = path.resolve(__dirname, './public/program-enrollment-certificate-template/pehliUdaan/certificate.html');
    
    // Use the file:// protocol with the absolute path
    await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0' });

    // Generate PDF
    await page.pdf({ path: 'output.pdf', format: 'A4', printBackground: true });

    await browser.close();
    console.log('PDF successfully created!');
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
