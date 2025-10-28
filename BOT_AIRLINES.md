# Bot Airlines - Country-Based Names

This document describes how bot airlines are named in the game based on the `airlines.csv` file.

## Overview

All bot airlines are automatically named based on the country where they're headquartered, using the airline names defined in `airlines.csv`. This creates a realistic and authentic feel where airlines match their country of operation.

## How It Works

1. **CSV Database**: The `airlines.csv` file contains real airline names for 200+ countries
2. **Country Matching**: Each bot airline's name is determined by its headquarters country code
3. **Automatic Generation**: When bot airlines are created, they automatically get the appropriate name
4. **Fallback System**: If a country isn't in the CSV, it falls back to a generic name

## Bot Airline Categories

### National Flag Carriers

**Major Routes (Boeing 737/777 fleet):**
- 🇺🇸 **United States** → American Airlines
- And any other country with large airports

**Regional Jets (Embraer/Comac fleet):**
- 🇨🇳 **China** → Air China
- 🇷🇺 **Russia** → Aeroflot  
- 🇮🇳 **India** → Air India
- 🇮🇩 **Indonesia** → Garuda Indonesia
- 🇧🇷 **Brazil** → LATAM Brasil

**Legacy Fleet (DC-8/Boeing 727):**
- 🇯🇵 **Japan** → Japan Airlines
- 🇨🇦 **Canada** → Air Canada
- 🇹🇷 **Turkey** → Turkish Airlines
- 🇲🇽 **Mexico** → Aeroméxico
- 🇻🇳 **Vietnam** → Vietnam Airlines

### Regional Carriers

**Remote Routes (Cessna fleet):**
- 🦘 **Australia** → Qantas Regional
- 🍁 **Canada** → Air Canada Regional
- 🗽 **United States** → American Airlines Regional
- ❄️ **Denmark** → Scandinavian Airlines (SAS) Regional
- 🐻 **Russia** → Aeroflot Regional

*Note: Regional carriers automatically append "Regional" to the main carrier's name*

### Specialized Airlines

**Industry-Specific Carriers:**
- 🇪🇺 **EU Zone** → EuroWings Alliance (or based on first base country)
- 💼 **Banking** → Capital Airways (generic - no specific country)
- 🛢️ **Oil** → Petroleum Air (generic - no specific country)
- 💊 **Pharma** → MediFlight International (generic - no specific country)
- 💻 **Electronics** → TechConnect Air (generic - no specific country)
- ⛏️ **Mining** → Mineral Express (generic - no specific country)
- ⚓ **Marine** → Ocean Freight Airways (generic - no specific country)

**Special Operations:**
- 🚀 **Aerospace** (Toulouse, France) → Air France Executive
- ⚡ **Supersonic** (JFK, USA) → American Supersonic
- 🌴 **Latin America** (São Paulo, Brazil) → LATAM Brasil
- 🕌 **Arabian** → Based on first Arabic base country (e.g., Saudia, Etihad, etc.)
- 🏝️ **Caribbean** (Miami, USA) → American Airlines
- 🌊 **Pacific Islands** → Based on first Pacific island base

## Examples by Country Code

Here are some examples from `airlines.csv`:

| Country | Code | Airline Name |
|---------|------|--------------|
| United States | US | American Airlines |
| United Kingdom | GB | British Airways |
| Germany | DE | Lufthansa |
| France | FR | Air France |
| Japan | JP | Japan Airlines |
| Australia | AU | Qantas |
| Canada | CA | Air Canada |
| China | CN | Air China |
| India | IN | Air India |
| Brazil | BR | LATAM Brasil |
| Mexico | MX | Aeroméxico |
| Turkey | TR | Turkish Airlines |
| Russia | RU | Aeroflot |
| Indonesia | ID | Garuda Indonesia |
| Thailand | TH | Thai Airways International |
| Singapore | SG | Singapore Airlines |
| South Korea | KR | Korean Air |
| UAE | AE | Etihad Airways |
| Saudi Arabia | SA | Saudia |
| South Africa | ZA | South African Airways |

*...and 180+ more countries!*

## Features

All bot airlines now have:
- ✅ **Authentic Names** - Real airline names from each country
- ✅ **Automatic Assignment** - Names match the headquarters location
- ✅ **Unique Logos** - Procedurally generated logos for each airline
- ✅ **Regional Variants** - Remote carriers get "Regional" suffix
- ✅ **Specialized Divisions** - Special operations get appropriate suffixes (Executive, Supersonic, etc.)
- ✅ **Fallback System** - Generic names if country not in CSV

## Technical Details

### File Location
- Airline names: `/airlines.csv`
- Country codes: `/airline-data/country-data.csv`
- Generator: `/airline-data/src/main/scala/com/patson/init/AirlineGenerator.scala`

### Name Resolution
1. Bot airline's HQ airport is determined
2. Airport's country code is extracted (e.g., "US", "FR", "JP")
3. Country code is matched to country name in country-data.csv
4. Country name is matched to airline name in airlines.csv
5. Airline name is assigned to the bot

### Logo Generation
- Airlines with ID < 30 use the default rat logo
- Airlines with ID ≥ 30 get procedurally generated unique logos
- Logos are automatically created during airline generation using `LogoGenerator`

### Customization
To change airline names:
1. Edit `/airlines.csv`
2. Modify the "Airline" column for any country
3. Rebuild the airline-data module
4. Delete and regenerate bot airlines in the database

## Active Participation

All bot airlines:
- ✅ Compete for passengers on routes
- ✅ Buy and operate real aircraft
- ✅ Pay fuel, crew, and maintenance costs
- ✅ Build loyalty at airports
- ✅ Affect market dynamics
- ✅ Participate in alliances
- ✅ Establish bases and hubs

They are **not just decoration** - they're real competitors in the game economy!
