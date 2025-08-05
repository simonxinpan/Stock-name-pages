// /api/sp500-companies.js - 获取标普500公司列表
import crypto from 'crypto';

// 标普500公司列表（基于最新数据）
const SP500_COMPANIES = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'GOOG', name: 'Alphabet Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'LLY', name: 'Eli Lilly and Company' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'MA', name: 'Mastercard Incorporated' },
  { symbol: 'PG', name: 'The Procter & Gamble Company' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'HD', name: 'The Home Depot Inc.' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation' },
  { symbol: 'ABBV', name: 'AbbVie Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'BAC', name: 'Bank of America Corporation' },
  { symbol: 'CVX', name: 'Chevron Corporation' },
  { symbol: 'KO', name: 'The Coca-Cola Company' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
  { symbol: 'PEP', name: 'PepsiCo Inc.' },
  { symbol: 'LIN', name: 'Linde plc' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.' },
  { symbol: 'ORCL', name: 'Oracle Corporation' },
  { symbol: 'ACN', name: 'Accenture plc' },
  { symbol: 'NOW', name: 'ServiceNow Inc.' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'IBM', name: 'International Business Machines Corporation' },
  { symbol: 'GE', name: 'General Electric Company' },
  { symbol: 'CAT', name: 'Caterpillar Inc.' },
  { symbol: 'INTU', name: 'Intuit Inc.' },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated' },
  { symbol: 'QCOM', name: 'QUALCOMM Incorporated' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.' },
  { symbol: 'CMCSA', name: 'Comcast Corporation' },
  { symbol: 'AMAT', name: 'Applied Materials Inc.' },
  { symbol: 'HON', name: 'Honeywell International Inc.' },
  { symbol: 'AMGN', name: 'Amgen Inc.' },
  { symbol: 'T', name: 'AT&T Inc.' },
  { symbol: 'LOW', name: 'Lowe\'s Companies Inc.' },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.' },
  { symbol: 'AXP', name: 'American Express Company' },
  { symbol: 'SPGI', name: 'S&P Global Inc.' },
  { symbol: 'LRCX', name: 'Lam Research Corporation' },
  { symbol: 'DE', name: 'Deere & Company' },
  { symbol: 'GS', name: 'The Goldman Sachs Group Inc.' },
  { symbol: 'SYK', name: 'Stryker Corporation' },
  { symbol: 'MDT', name: 'Medtronic plc' },
  { symbol: 'TJX', name: 'The TJX Companies Inc.' },
  { symbol: 'VRTX', name: 'Vertex Pharmaceuticals Incorporated' },
  { symbol: 'BLK', name: 'BlackRock Inc.' },
  { symbol: 'SCHW', name: 'The Charles Schwab Corporation' },
  { symbol: 'PLD', name: 'Prologis Inc.' },
  { symbol: 'ADI', name: 'Analog Devices Inc.' },
  { symbol: 'PANW', name: 'Palo Alto Networks Inc.' },
  { symbol: 'ANET', name: 'Arista Networks Inc.' },
  { symbol: 'C', name: 'Citigroup Inc.' },
  { symbol: 'MU', name: 'Micron Technology Inc.' },
  { symbol: 'CB', name: 'Chubb Limited' },
  { symbol: 'FI', name: 'Fiserv Inc.' },
  { symbol: 'GILD', name: 'Gilead Sciences Inc.' },
  { symbol: 'SO', name: 'The Southern Company' },
  { symbol: 'KLAC', name: 'KLA Corporation' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'CME', name: 'CME Group Inc.' },
  { symbol: 'EQIX', name: 'Equinix Inc.' },
  { symbol: 'SNPS', name: 'Synopsys Inc.' },
  { symbol: 'CDNS', name: 'Cadence Design Systems Inc.' },
  { symbol: 'USB', name: 'U.S. Bancorp' },
  { symbol: 'REGN', name: 'Regeneron Pharmaceuticals Inc.' },
  { symbol: 'PNC', name: 'The PNC Financial Services Group Inc.' },
  { symbol: 'AON', name: 'Aon plc' },
  { symbol: 'APH', name: 'Amphenol Corporation' },
  { symbol: 'CL', name: 'Colgate-Palmolive Company' },
  { symbol: 'CRWD', name: 'CrowdStrike Holdings Inc.' },
  { symbol: 'MMC', name: 'Marsh & McLennan Companies Inc.' },
  { symbol: 'CSX', name: 'CSX Corporation' },
  { symbol: 'FTNT', name: 'Fortinet Inc.' },
  { symbol: 'ECL', name: 'Ecolab Inc.' },
  { symbol: 'WM', name: 'Waste Management Inc.' },
  { symbol: 'ITW', name: 'Illinois Tool Works Inc.' },
  { symbol: 'WELL', name: 'Welltower Inc.' },
  { symbol: 'SHW', name: 'The Sherwin-Williams Company' },
  { symbol: 'FCX', name: 'Freeport-McMoRan Inc.' },
  { symbol: 'BSX', name: 'Boston Scientific Corporation' },
  { symbol: 'MCO', name: 'Moody\'s Corporation' },
  { symbol: 'CARR', name: 'Carrier Global Corporation' },
  { symbol: 'ICE', name: 'Intercontinental Exchange Inc.' },
  { symbol: 'CMG', name: 'Chipotle Mexican Grill Inc.' },
  { symbol: 'PCAR', name: 'PACCAR Inc' },
  { symbol: 'MSI', name: 'Motorola Solutions Inc.' },
  { symbol: 'DUK', name: 'Duke Energy Corporation' },
  { symbol: 'TDG', name: 'TransDigm Group Incorporated' },
  { symbol: 'TT', name: 'Trane Technologies plc' },
  { symbol: 'EMR', name: 'Emerson Electric Co.' },
  { symbol: 'COF', name: 'Capital One Financial Corporation' },
  { symbol: 'NSC', name: 'Norfolk Southern Corporation' },
  { symbol: 'SLB', name: 'SLB' },
  { symbol: 'GD', name: 'General Dynamics Corporation' },
  { symbol: 'CPRT', name: 'Copart Inc.' },
  { symbol: 'ORLY', name: 'O\'Reilly Automotive Inc.' },
  { symbol: 'EOG', name: 'EOG Resources Inc.' },
  { symbol: 'WFC', name: 'Wells Fargo & Company' },
  { symbol: 'NOC', name: 'Northrop Grumman Corporation' },
  { symbol: 'RSG', name: 'Republic Services Inc.' },
  { symbol: 'FAST', name: 'Fastenal Company' },
  { symbol: 'FICO', name: 'Fair Isaac Corporation' },
  { symbol: 'ROP', name: 'Roper Technologies Inc.' },
  { symbol: 'KMB', name: 'Kimberly-Clark Corporation' },
  { symbol: 'DHR', name: 'Danaher Corporation' },
  { symbol: 'PAYX', name: 'Paychex Inc.' },
  { symbol: 'CTAS', name: 'Cintas Corporation' },
  { symbol: 'ODFL', name: 'Old Dominion Freight Line Inc.' },
  { symbol: 'EA', name: 'Electronic Arts Inc.' },
  { symbol: 'URI', name: 'United Rentals Inc.' },
  { symbol: 'MLM', name: 'Martin Marietta Materials Inc.' },
  { symbol: 'VMC', name: 'Vulcan Materials Company' },
  { symbol: 'CTSH', name: 'Cognizant Technology Solutions Corporation' },
  { symbol: 'LULU', name: 'Lululemon Athletica Inc.' },
  { symbol: 'NXPI', name: 'NXP Semiconductors N.V.' },
  { symbol: 'DXCM', name: 'DexCom Inc.' },
  { symbol: 'HCA', name: 'HCA Healthcare Inc.' },
  { symbol: 'VRSK', name: 'Verisk Analytics Inc.' },
  { symbol: 'EXC', name: 'Exelon Corporation' },
  { symbol: 'IDXX', name: 'IDEXX Laboratories Inc.' },
  { symbol: 'A', name: 'Agilent Technologies Inc.' },
  { symbol: 'IQV', name: 'IQVIA Holdings Inc.' },
  { symbol: 'KHC', name: 'The Kraft Heinz Company' },
  { symbol: 'GWW', name: 'W.W. Grainger Inc.' },
  { symbol: 'MPWR', name: 'Monolithic Power Systems Inc.' },
  { symbol: 'TTWO', name: 'Take-Two Interactive Software Inc.' },
  { symbol: 'XEL', name: 'Xcel Energy Inc.' },
  { symbol: 'AEP', name: 'American Electric Power Company Inc.' },
  { symbol: 'ADSK', name: 'Autodesk Inc.' },
  { symbol: 'MNST', name: 'Monster Beverage Corporation' },
  { symbol: 'EW', name: 'Edwards Lifesciences Corporation' },
  { symbol: 'PSA', name: 'Public Storage' },
  { symbol: 'FANG', name: 'Diamondback Energy Inc.' },
  { symbol: 'ROST', name: 'Ross Stores Inc.' },
  { symbol: 'YUM', name: 'Yum! Brands Inc.' },
  { symbol: 'CTVA', name: 'Corteva Inc.' },
  { symbol: 'DOW', name: 'Dow Inc.' },
  { symbol: 'GEHC', name: 'GE HealthCare Technologies Inc.' },
  { symbol: 'KMI', name: 'Kinder Morgan Inc.' },
  { symbol: 'HLT', name: 'Hilton Worldwide Holdings Inc.' },
  { symbol: 'CSGP', name: 'CoStar Group Inc.' },
  { symbol: 'AMP', name: 'Ameriprise Financial Inc.' },
  { symbol: 'BDX', name: 'Becton Dickinson and Company' },
  { symbol: 'ALL', name: 'The Allstate Corporation' },
  { symbol: 'MCHP', name: 'Microchip Technology Incorporated' },
  { symbol: 'CCI', name: 'Crown Castle Inc.' },
  { symbol: 'TEAM', name: 'Atlassian Corporation' },
  { symbol: 'AJG', name: 'Arthur J. Gallagher & Co.' },
  { symbol: 'BIIB', name: 'Biogen Inc.' },
  { symbol: 'CMI', name: 'Cummins Inc.' },
  { symbol: 'TEL', name: 'TE Connectivity Ltd.' },
  { symbol: 'TROW', name: 'T. Rowe Price Group Inc.' },
  { symbol: 'SBUX', name: 'Starbucks Corporation' },
  { symbol: 'AFL', name: 'Aflac Incorporated' },
  { symbol: 'AZO', name: 'AutoZone Inc.' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation' },
  { symbol: 'GRMN', name: 'Garmin Ltd.' },
  { symbol: 'TRV', name: 'The Travelers Companies Inc.' },
  { symbol: 'AIG', name: 'American International Group Inc.' },
  { symbol: 'BK', name: 'The Bank of New York Mellon Corporation' },
  { symbol: 'WDAY', name: 'Workday Inc.' },
  { symbol: 'ZTS', name: 'Zoetis Inc.' },
  { symbol: 'MSCI', name: 'MSCI Inc.' },
  { symbol: 'EL', name: 'The Estée Lauder Companies Inc.' },
  { symbol: 'KVUE', name: 'Kenvue Inc.' },
  { symbol: 'ANSS', name: 'ANSYS Inc.' },
  { symbol: 'MAR', name: 'Marriott International Inc.' },
  { symbol: 'MCK', name: 'McKesson Corporation' },
  { symbol: 'CVS', name: 'CVS Health Corporation' },
  { symbol: 'OTIS', name: 'Otis Worldwide Corporation' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.' },
  { symbol: 'O', name: 'Realty Income Corporation' },
  { symbol: 'SPG', name: 'Simon Property Group Inc.' },
  { symbol: 'CHTR', name: 'Charter Communications Inc.' },
  { symbol: 'NKE', name: 'NIKE Inc.' },
  { symbol: 'HUM', name: 'Humana Inc.' },
  { symbol: 'WMB', name: 'The Williams Companies Inc.' },
  { symbol: 'VICI', name: 'VICI Properties Inc.' },
  { symbol: 'DLTR', name: 'Dollar Tree Inc.' },
  { symbol: 'DECK', name: 'Deckers Outdoor Corporation' },
  { symbol: 'CPNG', name: 'Coupang Inc.' },
  { symbol: 'SMCI', name: 'Super Micro Computer Inc.' },
  { symbol: 'TPG', name: 'TPG Inc.' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.' },
  { symbol: 'ABNB', name: 'Airbnb Inc.' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.' },
  { symbol: 'SNOW', name: 'Snowflake Inc.' },
  { symbol: 'ZM', name: 'Zoom Video Communications Inc.' },
  { symbol: 'DOCU', name: 'DocuSign Inc.' },
  { symbol: 'PTON', name: 'Peloton Interactive Inc.' },
  { symbol: 'ROKU', name: 'Roku Inc.' },
  { symbol: 'PINS', name: 'Pinterest Inc.' },
  { symbol: 'SNAP', name: 'Snap Inc.' },
  { symbol: 'TWTR', name: 'Twitter Inc.' },
  { symbol: 'SQ', name: 'Block Inc.' },
  { symbol: 'SHOP', name: 'Shopify Inc.' },
  { symbol: 'SPOT', name: 'Spotify Technology S.A.' },
  { symbol: 'ZS', name: 'Zscaler Inc.' },
  { symbol: 'OKTA', name: 'Okta Inc.' },
  { symbol: 'DDOG', name: 'Datadog Inc.' },
  { symbol: 'NET', name: 'Cloudflare Inc.' },
  { symbol: 'ESTC', name: 'Elastic N.V.' },
  { symbol: 'MDB', name: 'MongoDB Inc.' },
  { symbol: 'SPLK', name: 'Splunk Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'WDAY', name: 'Workday Inc.' },
  { symbol: 'NOW', name: 'ServiceNow Inc.' },
  { symbol: 'VEEV', name: 'Veeva Systems Inc.' },
  { symbol: 'ZEN', name: 'Zendesk Inc.' },
  { symbol: 'TWLO', name: 'Twilio Inc.' },
  { symbol: 'PAYC', name: 'Paycom Software Inc.' },
  { symbol: 'COUP', name: 'Coupa Software Incorporated' },
  { symbol: 'BILL', name: 'Bill.com Holdings Inc.' },
  { symbol: 'GTLB', name: 'GitLab Inc.' },
  { symbol: 'PATH', name: 'UiPath Inc.' },
  { symbol: 'AI', name: 'C3.ai Inc.' },
  { symbol: 'RBLX', name: 'Roblox Corporation' },
  { symbol: 'U', name: 'Unity Software Inc.' },
  { symbol: 'HOOD', name: 'Robinhood Markets Inc.' },
  { symbol: 'SOFI', name: 'SoFi Technologies Inc.' },
  { symbol: 'AFRM', name: 'Affirm Holdings Inc.' },
  { symbol: 'UPST', name: 'Upstart Holdings Inc.' },
  { symbol: 'LC', name: 'LendingClub Corporation' },
  { symbol: 'OPEN', name: 'Opendoor Technologies Inc.' },
  { symbol: 'RKT', name: 'Rocket Companies Inc.' },
  { symbol: 'WISH', name: 'ContextLogic Inc.' },
  { symbol: 'CLOV', name: 'Clover Health Investments Corp.' },
  { symbol: 'SPCE', name: 'Virgin Galactic Holdings Inc.' },
  { symbol: 'NKLA', name: 'Nikola Corporation' },
  { symbol: 'RIDE', name: 'Lordstown Motors Corp.' },
  { symbol: 'LCID', name: 'Lucid Group Inc.' },
  { symbol: 'RIVN', name: 'Rivian Automotive Inc.' },
  { symbol: 'F', name: 'Ford Motor Company' },
  { symbol: 'GM', name: 'General Motors Company' },
  { symbol: 'STLA', name: 'Stellantis N.V.' },
  { symbol: 'TM', name: 'Toyota Motor Corporation' },
  { symbol: 'HMC', name: 'Honda Motor Co. Ltd.' },
  { symbol: 'NSANY', name: 'Nissan Motor Co. Ltd.' },
  { symbol: 'VWAGY', name: 'Volkswagen AG' },
  { symbol: 'BMWYY', name: 'Bayerische Motoren Werke Aktiengesellschaft' },
  { symbol: 'DDAIF', name: 'Daimler AG' },
  { symbol: 'POAHY', name: 'Porsche Automobil Holding SE' },
  { symbol: 'FERRF', name: 'Ferrari N.V.' },
  { symbol: 'RACE', name: 'Ferrari N.V.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NIO', name: 'NIO Inc.' },
  { symbol: 'XPEV', name: 'XPeng Inc.' },
  { symbol: 'LI', name: 'Li Auto Inc.' },
  { symbol: 'BYDDY', name: 'BYD Company Limited' },
  { symbol: 'KNDI', name: 'Kandi Technologies Group Inc.' },
  { symbol: 'SOLO', name: 'Electrameccanica Vehicles Corp.' },
  { symbol: 'WKHS', name: 'Workhorse Group Inc.' },
  { symbol: 'HYLN', name: 'Hyliion Holdings Corp.' },
  { symbol: 'BLNK', name: 'Blink Charging Co.' },
  { symbol: 'CHPT', name: 'ChargePoint Holdings Inc.' },
  { symbol: 'EVGO', name: 'EVgo Inc.' },
  { symbol: 'VLTA', name: 'Volta Inc.' },
  { symbol: 'WBX', name: 'Wallbox N.V.' },
  { symbol: 'STEM', name: 'Stem Inc.' },
  { symbol: 'QS', name: 'QuantumScape Corporation' },
  { symbol: 'SES', name: 'SES AI Corporation' },
  { symbol: 'SLDP', name: 'Solid Power Inc.' },
  { symbol: 'AMPX', name: 'Amprius Technologies Inc.' },
  { symbol: 'ENER', name: 'Acciona Energia S.A.' },
  { symbol: 'FSLR', name: 'First Solar Inc.' },
  { symbol: 'ENPH', name: 'Enphase Energy Inc.' },
  { symbol: 'SEDG', name: 'SolarEdge Technologies Inc.' },
  { symbol: 'SPWR', name: 'SunPower Corporation' },
  { symbol: 'RUN', name: 'Sunrun Inc.' },
  { symbol: 'NOVA', name: 'Sunnova Energy International Inc.' },
  { symbol: 'CSIQ', name: 'Canadian Solar Inc.' },
  { symbol: 'JKS', name: 'JinkoSolar Holding Co. Ltd.' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor Manufacturing Company Limited' },
  { symbol: 'ASML', name: 'ASML Holding N.V.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'QCOM', name: 'QUALCOMM Incorporated' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'TXN', name: 'Texas Instruments Incorporated' },
  { symbol: 'ADI', name: 'Analog Devices Inc.' },
  { symbol: 'MRVL', name: 'Marvell Technology Inc.' },
  { symbol: 'NXPI', name: 'NXP Semiconductors N.V.' },
  { symbol: 'MU', name: 'Micron Technology Inc.' },
  { symbol: 'LRCX', name: 'Lam Research Corporation' },
  { symbol: 'AMAT', name: 'Applied Materials Inc.' },
  { symbol: 'KLAC', name: 'KLA Corporation' },
  { symbol: 'SNPS', name: 'Synopsys Inc.' },
  { symbol: 'CDNS', name: 'Cadence Design Systems Inc.' },
  { symbol: 'MCHP', name: 'Microchip Technology Incorporated' },
  { symbol: 'ON', name: 'ON Semiconductor Corporation' },
  { symbol: 'MPWR', name: 'Monolithic Power Systems Inc.' },
  { symbol: 'SWKS', name: 'Skyworks Solutions Inc.' },
  { symbol: 'QRVO', name: 'Qorvo Inc.' },
  { symbol: 'RMBS', name: 'Rambus Inc.' },
  { symbol: 'CRUS', name: 'Cirrus Logic Inc.' },
  { symbol: 'SLAB', name: 'Silicon Laboratories Inc.' },
  { symbol: 'DIOD', name: 'Diodes Incorporated' },
  { symbol: 'POWI', name: 'Power Integrations Inc.' },
  { symbol: 'VICR', name: 'Vicor Corporation' },
  { symbol: 'FORM', name: 'FormFactor Inc.' },
  { symbol: 'ACLS', name: 'Axcelis Technologies Inc.' },
  { symbol: 'UCTT', name: 'Ultra Clean Holdings Inc.' },
  { symbol: 'ICHR', name: 'Ichor Holdings Ltd.' },
  { symbol: 'COHU', name: 'Cohu Inc.' },
  { symbol: 'MKSI', name: 'MKS Instruments Inc.' },
  { symbol: 'ENTG', name: 'Entegris Inc.' },
  { symbol: 'CCMP', name: 'Cabot Microelectronics Corporation' },
  { symbol: 'VERX', name: 'Vertex Inc.' },
  { symbol: 'PLAB', name: 'Photronics Inc.' },
  { symbol: 'AMKR', name: 'Amkor Technology Inc.' },
  { symbol: 'SPIL', name: 'Siliconware Precision Industries Co. Ltd.' },
  { symbol: 'ASX', name: 'Advanced Semiconductor Engineering Inc.' },
  { symbol: 'UMC', name: 'United Microelectronics Corporation' },
  { symbol: 'HIMX', name: 'Himax Technologies Inc.' },
  { symbol: 'SIMO', name: 'Silicon Motion Technology Corporation' },
  { symbol: 'CEVA', name: 'CEVA Inc.' },
  { symbol: 'INPX', name: 'Inpixon' },
  { symbol: 'KOPN', name: 'Kopin Corporation' },
  { symbol: 'VUZI', name: 'Vuzix Corporation' },
  { symbol: 'MVIS', name: 'MicroVision Inc.' },
  { symbol: 'EMAN', name: 'eMagin Corporation' },
  { symbol: 'WIMI', name: 'WiMi Hologram Cloud Inc.' },
  { symbol: 'GOOG', name: 'Alphabet Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'CMCSA', name: 'Comcast Corporation' },
  { symbol: 'T', name: 'AT&T Inc.' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.' },
  { symbol: 'CHTR', name: 'Charter Communications Inc.' },
  { symbol: 'DISH', name: 'DISH Network Corporation' },
  { symbol: 'SIRI', name: 'Sirius XM Holdings Inc.' },
  { symbol: 'WBD', name: 'Warner Bros. Discovery Inc.' },
  { symbol: 'PARA', name: 'Paramount Global' },
  { symbol: 'FOX', name: 'Fox Corporation' },
  { symbol: 'FOXA', name: 'Fox Corporation' },
  { symbol: 'NWSA', name: 'News Corporation' },
  { symbol: 'NWS', name: 'News Corporation' },
  { symbol: 'NYT', name: 'The New York Times Company' },
  { symbol: 'GANNETT', name: 'Gannett Co. Inc.' },
  { symbol: 'MCS', name: 'The Marcus Corporation' },
  { symbol: 'CNK', name: 'Cinemark Holdings Inc.' },
  { symbol: 'AMC', name: 'AMC Entertainment Holdings Inc.' },
  { symbol: 'IMAX', name: 'IMAX Corporation' },
  { symbol: 'LYV', name: 'Live Nation Entertainment Inc.' },
  { symbol: 'MSG', name: 'Madison Square Garden Sports Corp.' },
  { symbol: 'MSGS', name: 'Madison Square Garden Sports Corp.' },
  { symbol: 'MSGE', name: 'Madison Square Garden Entertainment Corp.' },
  { symbol: 'FUBO', name: 'fuboTV Inc.' },
  { symbol: 'ROKU', name: 'Roku Inc.' },
  { symbol: 'SPOT', name: 'Spotify Technology S.A.' },
  { symbol: 'WMG', name: 'Warner Music Group Corp.' },
  { symbol: 'UMG', name: 'Universal Music Group N.V.' },
  { symbol: 'SONY', name: 'Sony Group Corporation' },
  { symbol: 'EA', name: 'Electronic Arts Inc.' },
  { symbol: 'ATVI', name: 'Activision Blizzard Inc.' },
  { symbol: 'TTWO', name: 'Take-Two Interactive Software Inc.' },
  { symbol: 'ZNGA', name: 'Zynga Inc.' },
  { symbol: 'RBLX', name: 'Roblox Corporation' },
  { symbol: 'U', name: 'Unity Software Inc.' },
  { symbol: 'DKNG', name: 'DraftKings Inc.' },
  { symbol: 'PENN', name: 'PENN Entertainment Inc.' },
  { symbol: 'CZR', name: 'Caesars Entertainment Inc.' },
  { symbol: 'MGM', name: 'MGM Resorts International' },
  { symbol: 'LVS', name: 'Las Vegas Sands Corp.' },
  { symbol: 'WYNN', name: 'Wynn Resorts Limited' },
  { symbol: 'BYD', name: 'Boyd Gaming Corporation' },
  { symbol: 'ERI', name: 'Eldorado Resorts Inc.' },
  { symbol: 'GDEN', name: 'Golden Entertainment Inc.' },
  { symbol: 'CRC', name: 'California Resources Corporation' },
  { symbol: 'PLAY', name: 'Dave & Buster\'s Entertainment Inc.' },
  { symbol: 'SIX', name: 'Six Flags Entertainment Corporation' },
  { symbol: 'FUN', name: 'Cedar Fair L.P.' },
  { symbol: 'SEAS', name: 'SeaWorld Entertainment Inc.' },
  { symbol: 'RCL', name: 'Royal Caribbean Cruises Ltd.' },
  { symbol: 'CCL', name: 'Carnival Corporation & plc' },
  { symbol: 'NCLH', name: 'Norwegian Cruise Line Holdings Ltd.' },
  { symbol: 'AAL', name: 'American Airlines Group Inc.' },
  { symbol: 'DAL', name: 'Delta Air Lines Inc.' },
  { symbol: 'UAL', name: 'United Airlines Holdings Inc.' },
  { symbol: 'LUV', name: 'Southwest Airlines Co.' },
  { symbol: 'JBLU', name: 'JetBlue Airways Corporation' },
  { symbol: 'ALK', name: 'Alaska Air Group Inc.' },
  { symbol: 'SKYW', name: 'SkyWest Inc.' },
  { symbol: 'MESA', name: 'Mesa Air Group Inc.' },
  { symbol: 'HA', name: 'Hawaiian Holdings Inc.' },
  { symbol: 'SAVE', name: 'Spirit Airlines Inc.' },
  { symbol: 'ULCC', name: 'Frontier Group Holdings Inc.' },
  { symbol: 'ALGT', name: 'Allegiant Travel Company' },
  { symbol: 'JBHT', name: 'J.B. Hunt Transport Services Inc.' },
  { symbol: 'KNX', name: 'Knight-Swift Transportation Holdings Inc.' },
  { symbol: 'ODFL', name: 'Old Dominion Freight Line Inc.' },
  { symbol: 'SAIA', name: 'Saia Inc.' },
  { symbol: 'ARCB', name: 'ArcBest Corporation' },
  { symbol: 'YELL', name: 'Yellow Corporation' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.' },
  { symbol: 'FDX', name: 'FedEx Corporation' },
  { symbol: 'CHRW', name: 'C.H. Robinson Worldwide Inc.' },
  { symbol: 'XPO', name: 'XPO Logistics Inc.' },
  { symbol: 'EXPD', name: 'Expeditors International of Washington Inc.' },
  { symbol: 'LSTR', name: 'Landstar System Inc.' },
  { symbol: 'HUBG', name: 'Hub Group Inc.' },
  { symbol: 'MATX', name: 'Matson Inc.' },
  { symbol: 'KEX', name: 'Kirby Corporation' },
  { symbol: 'GATX', name: 'GATX Corporation' },
  { symbol: 'TRN', name: 'Trinity Industries Inc.' },
  { symbol: 'RAIL', name: 'FreightCar America Inc.' },
  { symbol: 'GBX', name: 'The Greenbrier Companies Inc.' },
  { symbol: 'WAB', name: 'Westinghouse Air Brake Technologies Corporation' },
  { symbol: 'UNP', name: 'Union Pacific Corporation' },
  { symbol: 'CSX', name: 'CSX Corporation' },
  { symbol: 'NSC', name: 'Norfolk Southern Corporation' },
  { symbol: 'KSU', name: 'Kansas City Southern' },
  { symbol: 'CNI', name: 'Canadian National Railway Company' },
  { symbol: 'CP', name: 'Canadian Pacific Railway Limited' },
  { symbol: 'GWR', name: 'Genesee & Wyoming Inc.' },
  { symbol: 'RAIL', name: 'FreightCar America Inc.' }
];

// 火山引擎翻译函数
async function translateWithVolcEngine(text, accessKeyId, secretAccessKey, targetLang = 'zh') {
  const host = 'translate.volcengineapi.com';
  const service = 'translate';
  const region = 'cn-north-1';
  const action = 'TranslateText';
  const version = '2020-06-01';
  
  // 构建请求体
  const body = JSON.stringify({
    TargetLanguage: targetLang,
    TextList: [text]
  });
  
  // 生成时间戳
  const now = new Date();
  const timestamp = Math.floor(now.getTime() / 1000);
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const dateTime = now.toISOString().replace(/[:\-]|\..*/, '').slice(0, 15) + 'Z';
  
  // 构建请求头
  const headers = {
    'Content-Type': 'application/json',
    'Host': host,
    'X-Date': dateTime,
    'X-Content-Sha256': crypto.createHash('sha256').update(body).digest('hex')
  };
  
  // 构建签名
  const credentialScope = `${date}/${region}/${service}/request`;
  const algorithm = 'HMAC-SHA256';
  
  // 构建规范请求
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}`)
    .join('\n');
  
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');
  
  const canonicalRequest = [
    'POST',
    '/',
    `Action=${action}&Version=${version}`,
    canonicalHeaders + '\n',
    signedHeaders,
    headers['X-Content-Sha256']
  ].join('\n');
  
  // 构建待签名字符串
  const stringToSign = [
    algorithm,
    dateTime,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  // 计算签名
  const kDate = crypto.createHmac('sha256', 'VOLC' + secretAccessKey).update(date).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  
  // 构建Authorization头
  const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  try {
    const response = await fetch(`https://${host}/?Action=${action}&Version=${version}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Authorization': authorization
      },
      body: body
    });
    
    const result = await response.json();
    
    if (result.ResponseMetadata && result.ResponseMetadata.Error) {
      throw new Error(`Translation API Error: ${result.ResponseMetadata.Error.Message}`);
    }
    
    if (result.TranslationList && result.TranslationList.length > 0) {
      return result.TranslationList[0].Translation;
    }
    
    throw new Error('No translation result received');
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

export default async function handler(request, response) {
  // 设置CORS头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  
  try {
    const { method, query } = request;
    
    if (method === 'GET') {
      // 返回所有标普500公司列表
      const { translate } = query;
      
      if (translate === 'true') {
        // 批量翻译所有公司名称
        const accessKeyId = process.env.VOLC_ACCESS_KEY_ID;
        const secretAccessKey = process.env.VOLC_SECRET_ACCESS_KEY;
        
        if (!accessKeyId || !secretAccessKey) {
          return response.status(500).json({
            error: 'Translation service not configured',
            companies: SP500_COMPANIES
          });
        }
        
        console.log('🔄 [SP500 API] Starting batch translation for', SP500_COMPANIES.length, 'companies');
        
        const translatedCompanies = [];
        const batchSize = 10; // 每批处理10个公司
        
        for (let i = 0; i < SP500_COMPANIES.length; i += batchSize) {
          const batch = SP500_COMPANIES.slice(i, i + batchSize);
          const batchPromises = batch.map(async (company) => {
            try {
              const translatedName = await translateWithVolcEngine(
                company.name,
                accessKeyId,
                secretAccessKey,
                'zh'
              );
              console.log(`✅ [SP500 API] Translated: ${company.name} -> ${translatedName}`);
              return {
                ...company,
                chinese_name: translatedName
              };
            } catch (error) {
              console.error(`❌ [SP500 API] Translation failed for ${company.name}:`, error.message);
              return {
                ...company,
                chinese_name: company.name // 翻译失败时保持原名
              };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          translatedCompanies.push(...batchResults);
          
          // 添加延迟以避免API限制
          if (i + batchSize < SP500_COMPANIES.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log('🎉 [SP500 API] Batch translation completed');
        
        return response.status(200).json({
          success: true,
          total: translatedCompanies.length,
          companies: translatedCompanies
        });
      } else {
        // 返回原始列表
        return response.status(200).json({
          success: true,
          total: SP500_COMPANIES.length,
          companies: SP500_COMPANIES
        });
      }
    }
    
    if (method === 'POST') {
      // 翻译单个公司名称
      const { symbol, name } = request.body;
      
      if (!symbol && !name) {
        return response.status(400).json({
          error: 'Symbol or name is required'
        });
      }
      
      const accessKeyId = process.env.VOLC_ACCESS_KEY_ID;
      const secretAccessKey = process.env.VOLC_SECRET_ACCESS_KEY;
      
      if (!accessKeyId || !secretAccessKey) {
        return response.status(500).json({
          error: 'Translation service not configured'
        });
      }
      
      // 查找公司信息
      let company;
      if (symbol) {
        company = SP500_COMPANIES.find(c => c.symbol === symbol.toUpperCase());
      } else {
        company = SP500_COMPANIES.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
      }
      
      if (!company) {
        return response.status(404).json({
          error: 'Company not found in S&P 500 list'
        });
      }
      
      try {
        console.log(`🔄 [SP500 API] Translating: ${company.name}`);
        
        const translatedName = await translateWithVolcEngine(
          company.name,
          accessKeyId,
          secretAccessKey,
          'zh'
        );
        
        console.log(`✅ [SP500 API] Translation result: ${company.name} -> ${translatedName}`);
        
        return response.status(200).json({
          success: true,
          symbol: company.symbol,
          english_name: company.name,
          chinese_name: translatedName
        });
      } catch (error) {
        console.error(`❌ [SP500 API] Translation failed for ${company.name}:`, error.message);
        
        return response.status(500).json({
          error: 'Translation failed',
          symbol: company.symbol,
          english_name: company.name,
          chinese_name: company.name // 翻译失败时返回原名
        });
      }
    }
    
    return response.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('❌ [SP500 API] Server error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}