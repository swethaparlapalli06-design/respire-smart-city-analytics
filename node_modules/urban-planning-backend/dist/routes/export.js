"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRoutes = void 0;
const express_1 = require("express");
const puppeteer_1 = __importDefault(require("puppeteer"));
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.exportRoutes = router;
const exportSchema = joi_1.default.object({
    zoneId: joi_1.default.string().required(),
    simulationResult: joi_1.default.object().optional(),
    includeTraffic: joi_1.default.boolean().default(true),
    includeAqi: joi_1.default.boolean().default(true),
    includeAlerts: joi_1.default.boolean().default(true)
});
router.get('/summary', async (req, res) => {
    try {
        const { error, value } = exportSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                error: 'Invalid export request',
                details: error.details[0].message
            });
        }
        const { zoneId, simulationResult, includeTraffic, includeAqi, includeAlerts } = value;
        const pdfContent = await generatePdfContent({
            zoneId,
            simulationResult,
            includeTraffic,
            includeAqi,
            includeAlerts
        });
        const browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(pdfContent, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });
        await browser.close();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="urban-planning-summary-${zoneId}-${Date.now()}.pdf"`);
        res.setHeader('Content-Length', pdf.length);
        res.send(pdf);
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            error: 'Failed to generate PDF',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/data', async (req, res) => {
    try {
        const { zoneId, format = 'json' } = req.query;
        if (!zoneId) {
            return res.status(400).json({ error: 'zoneId is required' });
        }
        const data = {
            zoneId,
            timestamp: new Date().toISOString(),
            traffic: {
                segments: [],
                incidents: []
            },
            aqi: {
                stations: [],
                cells: []
            },
            alerts: [],
            simulations: []
        };
        if (format === 'csv') {
            const csv = convertToCsv(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="urban-planning-data-${zoneId}.csv"`);
            res.send(csv);
        }
        else {
            res.json(data);
        }
    }
    catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            error: 'Failed to export data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
async function generatePdfContent(options) {
    const { zoneId, simulationResult, includeTraffic, includeAqi, includeAlerts } = options;
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Urban Planning Summary - Zone ${zoneId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #3b82f6;
          margin: 0;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #1e40af;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .metric {
          display: inline-block;
          margin: 10px 20px 10px 0;
          padding: 10px;
          background: #f8fafc;
          border-radius: 5px;
          border-left: 4px solid #3b82f6;
        }
        .metric-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .metric-value {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
        }
        .alert-high {
          background: #fef2f2;
          border-left-color: #dc2626;
        }
        .alert-medium {
          background: #fffbeb;
          border-left-color: #f59e0b;
        }
        .recommendations {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #0ea5e9;
        }
        .recommendations ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Urban Planning Platform</h1>
        <p>Zone Analysis Summary - ${zoneId}</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      ${includeAlerts ? `
        <div class="section">
          <h2>Air Quality Alerts</h2>
          <div class="metric alert-high">
            <div class="metric-label">Current AQI</div>
            <div class="metric-value">220</div>
          </div>
          <div class="metric alert-high">
            <div class="metric-label">Severity</div>
            <div class="metric-value">High Priority</div>
          </div>
          <div class="metric alert-high">
            <div class="metric-label">Top Pollutant</div>
            <div class="metric-value">PM2.5</div>
          </div>
          <div class="metric alert-high">
            <div class="metric-label">Population Exposed</div>
            <div class="metric-value">12,000</div>
          </div>
        </div>
      ` : ''}

      ${simulationResult ? `
        <div class="section">
          <h2>Simulation Results</h2>
          <div class="metric">
            <div class="metric-label">Baseline AQI</div>
            <div class="metric-value">${simulationResult.baseline.aqi}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Predicted AQI</div>
            <div class="metric-value">${simulationResult.predicted.aqi}</div>
          </div>
          <div class="metric">
            <div class="metric-label">AQI Improvement</div>
            <div class="metric-value">-${simulationResult.impact.deltaAqi}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Population Benefiting</div>
            <div class="metric-value">${simulationResult.impact.populationBenefiting.toLocaleString()}</div>
          </div>
          
          <div class="recommendations">
            <h3>Recommended Actions</h3>
            <ul>
              ${simulationResult.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
      ` : ''}

      ${includeTraffic ? `
        <div class="section">
          <h2>Traffic Conditions</h2>
          <div class="metric">
            <div class="metric-label">Active Incidents</div>
            <div class="metric-value">3</div>
          </div>
          <div class="metric">
            <div class="metric-label">Average Speed</div>
            <div class="metric-value">25 km/h</div>
          </div>
          <div class="metric">
            <div class="metric-label">Congestion Level</div>
            <div class="metric-value">High</div>
          </div>
        </div>
      ` : ''}

      ${includeAqi ? `
        <div class="section">
          <h2>Air Quality Details</h2>
          <div class="metric">
            <div class="metric-label">PM2.5</div>
            <div class="metric-value">105 μg/m³</div>
          </div>
          <div class="metric">
            <div class="metric-label">PM10</div>
            <div class="metric-value">150 μg/m³</div>
          </div>
          <div class="metric">
            <div class="metric-label">NO₂</div>
            <div class="metric-value">55 ppb</div>
          </div>
          <div class="metric">
            <div class="metric-label">O₃</div>
            <div class="metric-value">30 ppb</div>
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p>This report was generated by the Urban Planning Platform</p>
        <p>For more information, visit the dashboard at your local instance</p>
      </div>
    </body>
    </html>
  `;
}
function convertToCsv(data) {
    const headers = ['Zone ID', 'Timestamp', 'AQI', 'PM2.5', 'PM10', 'NO2', 'O3'];
    const rows = [headers.join(',')];
    rows.push([
        data.zoneId,
        data.timestamp,
        '220',
        '105',
        '150',
        '55',
        '30'
    ].join(','));
    return rows.join('\n');
}
//# sourceMappingURL=export.js.map