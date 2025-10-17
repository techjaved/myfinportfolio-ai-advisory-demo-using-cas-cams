import express from "express";
import cors from "cors"
import dotenv from "dotenv"
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express()

const port = process.env.PORT || 5005;
app.use( cors({
    origin: "http://localhost:5005", // or your actual frontend port
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }))
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")));

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ai promot generation
function buildPrompt(userPortfolio) {
    const { profileDetails, ...assets } = userPortfolio;
    console.log("assets",assets)

    // Build readable summary of user's financial profile
    const profileSection = profileDetails
        ? `
User Profile:
- Date of Birth: ${profileDetails.dob}
- Gender: ${profileDetails.gender}
- Dependents: ${profileDetails.noOfDependents}
- Occupation: ${profileDetails.occupation}
- Annual Income: ₹${profileDetails.annualIncome}
- Tax Bracket: ${profileDetails.taxBracket}
- Investment Corpus: ₹${profileDetails.exactAnnualInvestmentIncomeCorpus}
`
        : "";

    // Summarize all assets dynamically
    const portfolioSection = Object.entries(assets)
        .map(([category, value]) => {
            if (Array.isArray(value) && value.length > 0) {
                return `\n${category.toUpperCase()}:\n` + value.map((v, i) => {
                    return `  ${i + 1}. Name: ${v.name || "N/A"}, Amount: ₹${v.amount || 0}, Invest Date: ${v.investDate || "N/A"}, Maturity: ${v.maturityDate || "N/A"}, Variables: ${JSON.stringify(v.variables || {})}`;
                }).join("\n");
            } else if (typeof value === "object" && value.totalAmount) {
                return `\n${category.toUpperCase()}: ₹${value.totalAmount}`;
            }
            return `\n${category.toUpperCase()}: None`;
        })
        .join("\n");

    return `
You are an experienced investment advisor AI that helps investors optimize their portfolios.

You will receive a list of investments in JSON format. Each record contains the investment type, name, amount, and any available variables (like interest rate, tenure, past CAGR, etc.).

Analyze the portfolio as a whole, and for each asset:
1. Provide an overall market evaluation.
2. Suggest whether to Buy / Hold / Sell / Reduce exposure.
3. Recommend an ideal allocation percentage for a balanced, risk-adjusted portfolio.

Consider the following asset types and their relevant evaluation variables:

| Asset Type         | Variable 1                   | Variable 2           | Variable 3         | Variable 4        |
|--------------------|------------------------------|----------------------|--------------------|-------------------|
| Fixed Deposits     | Interest rate                | Rating               | Tenure             | -                 |
| Corporate Bonds    | Interest rate                | Rating               | Tenure             | -                 |
| Digital Gold       | Past CAGR (1,3,5 years)      | -                    | -                  | -                 |
| Government Schemes | Eligibility                  | Return               | Tenure             | -                 |
| Mutual Funds       | Past CAGR (1,3,5 years)      | Fund Manager rating  | Expense Ratio      | Volatility        |
| ETFs               | Past CAGR (1,3,5 years)      | Fund Manager rating  | Expense Ratio      | Volatility        |

---

### OUTPUT REQUIREMENTS
Respond **strictly in JSON format only**, following this schema exactly.

{
  "userProfile": {
    "dob": "1990-01-01",
    "gender": "male",
    "dependents": 3,
    "occupation": "Software Developer",
    "annualIncome": 650000,
    "taxBracket": "5000-10000",
    "annualInvestmentCorpus": 452000,
    "pan": "CYQPM5604L"
  },
  "portfolio": {
    "totalInvestment": 145000,
    "assets": {
      "mutualFunds": {
        "totalAmount": 36250,
        "percentage": 25,
        "holdings": [
          {
            "name": "Axis Bluechip Fund",
            "amount": 5000,
            "investDate": "2023-01-10",
            "maturityDate": "2026-01-10"
          },
          {
            "name": "HDFC Flexi Cap",
            "amount": 3000,
            "investDate": "2024-04-01",
            "maturityDate": "2026-05-15"
          }
        ]
      },
      "etfs": {
        "totalAmount": 21750,
        "percentage": 15,
        "holdings": [
          {
            "name": "Nippon Gold ETF",
            "amount": 2000,
            "investDate": "2024-01-10",
            "maturityDate": null
          }
        ]
      },
      "digitalGold": {
        "totalAmount": 21750,
        "percentage": 16.7
      },
      "fixedDeposits": {
        "totalAmount": 24167,
        "percentage": 15,
        "holdings": [
          {
            "name": "ABC",
            "amount": 4500,
            "investDate": "2024-02-01",
            "maturityDate": "2026-09-25"
          },
          {
            "name": "XYZ",
            "amount": 6980,
            "investDate": "2025-10-06",
            "maturityDate": "2025-10-25"
          }
        ]
      },
      "corporateBonds": {
        "totalAmount": 24167,
        "percentage": 16.7,
        "holdings": [
          {
            "name": "LSM",
            "amount": 48565,
            "investDate": "2025-01-20",
            "maturityDate": "2026-06-27"
          },
          {
            "name": "GSM",
            "amount": 6985,
            "investDate": "2024-12-31",
            "maturityDate": "2026-06-24"
          }
        ]
      },
      "governmentSecurities": {
        "totalAmount": 17916,
        "percentage": 12.3,
        "holdings": [
          {
            "name": "Sukanya",
            "amount": 6985,
            "investDate": "2025-05-06",
            "maturityDate": "2026-02-18"
          },
          {
            "name": "Atal Pension",
            "amount": 4586,
            "investDate": "2025-06-18",
            "maturityDate": "2030-08-30"
          }
        ]
      }
    }
  },
  "advisorAnalysis": {
    "idealPortfolio": {
      "mutualFunds": 25,
      "etfs": 15,
      "digitalGold": 16.7,
      "fixedDeposits": 15,
      "corporateBonds": 16.7,
      "governmentSecurities": 12.3
    },
    "rebalancingRecommendations": [
      {
        "asset": "Fixed Deposits",
        "action": "Remove",
        "differencePercent": -20,
        "differenceAmount": -10000
      },
      {
        "asset": "Corporate Bonds",
        "action": "Add",
        "differencePercent": 30,
        "differenceAmount": 15000
      },
      {
        "asset": "Government Securities",
        "action": "Remove",
        "differencePercent": -10,
        "differenceAmount": -5000
      },
      {
        "asset": "Digital Gold",
        "action": "Remove",
        "differencePercent": -20,
        "differenceAmount": -10000
      },
      {
        "asset": "Mutual Funds",
        "action": "Add",
        "differencePercent": 20,
        "differenceAmount": 10000
      },
      {
        "asset": "ETFs",
        "action": "Remove",
        "differencePercent": -20,
        "differenceAmount": -10000
      }
    ],
    "potentialROI": {
      "estimatedReturn": "15% p.a",
      "riskLevel": "Moderate",
      "note": "Investments are subject to market risks. Please read all documents before investing."
    }
  },
  "buySellRecommendations": [
    {
      "asset": "Mutual Funds",
      "buy": [
        {
          "fundName": "HDFC Flexi Cap Fund",
          "amount": 10000,
          "reason": "Increase exposure to equity diversified fund with strong returns.",
          "platforms": [
            {
              "platformName": "Groww",
              "commission": "0%",
              "userRating": 4.6
            },
            {
              "platformName": "Kuvera",
              "commission": "0%",
              "userRating": 4.4
            }
          ]
        },
        {
          "fundName": "ICICI Bluechip Fund",
          "amount": 5000,
          "reason": "Enhance large-cap allocation for stable growth.",
          "platforms": [
            {
              "platformName": "Zerodha Coin",
              "commission": "0.1%",
              "userRating": 4.7
            }
          ]
        }
      ],
      "sell": [
        {
          "fundName": "Axis Bluechip Fund",
          "amount": 5000,
          "reason": "Rebalance due to overlapping holdings.",
          "platforms": [
            {
              "platformName": "Groww",
              "commission": "0%",
              "userRating": 4.6
            }
          ]
        }
      ]
    },
    {
      "asset": "Corporate Bonds",
      "buy": [
        {
          "fundName": "XYZ Corporate Bond Fund",
          "amount": 15000,
          "reason": "High credit rating and stable yield.",
          "platforms": [
            {
              "platformName": "HDFC Securities",
              "commission": "0.25%",
              "userRating": 4.3
            },
            {
              "platformName": "ICICI Direct",
              "commission": "0.3%",
              "userRating": 4.5
            }
          ]
        }
      ],
      "sell": [
        {
          "fundName": "LSM Bond",
          "amount": 5000,
          "reason": "Reduce long-duration exposure.",
          "platforms": [
            {
              "platformName": "Upstox",
              "commission": "0.15%",
              "userRating": 4.2
            }
          ]
        }
      ]
    },
    {
      "asset": "Digital Gold",
      "buy": [],
      "sell": [
        {
          "fundName": "Digital Gold Holding",
          "amount": 10000,
          "reason": "Reduce gold exposure for better portfolio balance.",
          "platforms": [
            {
              "platformName": "PhonePe Gold",
              "commission": "1%",
              "userRating": 4.1
            },
            {
              "platformName": "Paytm Gold",
              "commission": "1.5%",
              "userRating": 4.0
            }
          ]
        }
      ]
    },
    {
      "asset": "Government Securities",
      "buy": [],
      "sell": [
        {
          "fundName": "Atal Pension",
          "amount": 5000,
          "reason": "Shift from low-yield to moderate-risk fixed income options.",
          "platforms": [
            {
              "platformName": "RBI Direct",
              "commission": "0%",
              "userRating": 4.8
            }
          ]
        }
      ]
    }
  ]
}


RULES:
- Always produce valid JSON — no extra text.
- Ensure every investment in the input JSON has a corresponding advisory entry.
- “recommended_percentage” values should total 100%.
- Provide balanced, risk-adjusted allocations suitable for an average retail investor.

---

### INPUT PORTFOLIO (JSON):

${profileSection}

${portfolioSection}
  `;
}


// ---------------------
// Routes
// ---------------------

// POST /api/advisory
app.post("/api/advisor", async (req, res) => {
    try {
        const userPortfolio = req.body;

        const prompt = buildPrompt(userPortfolio);

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo", // or gpt-4.1 if you prefer
            messages: [
                {
                    role: "system",
                    content:
                        "You are a professional investment advisor AI. You must respond only in valid JSON according to the provided schema.",
                },
                { role: "user", content: prompt },
            ],
            // temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const aiResponse = completion.choices[0].message.content;
       
        res.json(JSON.parse(aiResponse));
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({
            error: "Failed to process AI advisory.",
            details: error.message,
        });
    }
});

app.use(express.static(path.join(__dirname, "public")));

// --------------------------
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------------------
// Start Server
// ---------------------
app.listen(port, () => {
    console.log(`🚀 AI Advisor Server running on http://localhost:${port}`);
});