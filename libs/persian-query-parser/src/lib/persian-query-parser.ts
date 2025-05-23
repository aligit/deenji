export interface ParsedQuery {
  propertyType?: string;
  bedrooms?: { min?: number; max?: number };
  bathrooms?: { min?: number; max?: number };
  price?: { min?: number; max?: number; currency: string };
  area?: { min?: number; max?: number };
  features?: string[];
  location?: string;
}

export class PersianQueryParser {
  private readonly propertyTypes = {
    خانه: 'house',
    آپارتمان: 'apartment',
    ویلا: 'villa',
    زمین: 'land',
    کلنگی: 'demolition',
  };

  private readonly features = {
    نوساز: 'newly_built',
    سنددار: 'documented',
    پارکینگ: 'parking',
    انباری: 'storage',
    بالکن: 'balcony',
  };

  private readonly priceUnits = {
    تومن: 10_000_000, // 1 toman = 10 million rials
    میلیون: 1_000_000,
    میلیارد: 1_000_000_000,
  };

  parseQuery(query: string): ParsedQuery {
    const result: ParsedQuery = {};

    // Normalize Persian digits
    query = this.normalizePersianText(query);

    // Parse property type
    result.propertyType = this.extractPropertyType(query);

    // Parse bedrooms
    result.bedrooms = this.extractBedrooms(query);

    // Parse bathrooms
    result.bathrooms = this.extractBathrooms(query);

    // Parse price
    result.price = this.extractPrice(query);

    // Parse area
    result.area = this.extractArea(query);

    // Parse features
    result.features = this.extractFeatures(query);

    return result;
  }

  private normalizePersianText(text: string): string {
    // Convert Persian/Arabic digits to Latin
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const latinDigits = '0123456789';

    let result = text;
    for (let i = 0; i < persianDigits.length; i++) {
      result = result.replace(
        new RegExp(persianDigits[i], 'g'),
        latinDigits[i]
      );
      result = result.replace(new RegExp(arabicDigits[i], 'g'), latinDigits[i]);
    }
    return result;
  }

  private extractPropertyType(query: string): string | undefined {
    for (const [persian, english] of Object.entries(this.propertyTypes)) {
      if (query.includes(persian)) {
        return english;
      }
    }
    return undefined;
  }

  private extractBedrooms(
    query: string
  ): { min?: number; max?: number } | undefined {
    // Pattern: "۲ خوابه" or "حداقل ۳ خوابه"
    const bedroomPattern = /(?:حداقل\s+)?(\d+)(?:\+)?\s*خوابه/;
    const match = query.match(bedroomPattern);

    if (match) {
      const num = parseInt(match[1]);
      if (query.includes('حداقل') || query.includes('+')) {
        return { min: num };
      }
      return { min: num, max: num };
    }
    return undefined;
  }

  private extractBathrooms(
    query: string
  ): { min?: number; max?: number } | undefined {
    // Pattern: "۲ حمام" or "حداقل ۱ سرویس"
    const patterns = [/(?:حداقل\s+)?(\d+)(?:\+)?\s*(?:حمام|سرویس)/];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const num = parseInt(match[1]);
        if (query.includes('حداقل') || query.includes('+')) {
          return { min: num };
        }
        return { min: num, max: num };
      }
    }
    return undefined;
  }

  // Change the return type
  private extractPrice(
    query: string
  ): { min?: number; max?: number; currency: string } | undefined {
    // Added currency to return type
    // Between pattern
    const betweenPattern =
      /بین\s+(\d+(?:\.\d+)?)\s*(?:تا|_|تتا)\s*(\d+(?:\.\d+)?)\s*(تومن|میلیون|میلیارد)/;
    let match = query.match(betweenPattern);
    if (match) {
      const [, min, max, unit] = match;
      const multiplier = this.priceUnits[unit as keyof typeof this.priceUnits];
      return {
        min: parseFloat(min) * multiplier,
        max: parseFloat(max) * multiplier,
        currency: 'IRR', // Add currency
      };
    }

    // Up to pattern
    const upToPattern =
      /(?:تا|حداکثر|زیر)\s+(\d+(?:\.\d+)?)\s*(تومن|میلیون|میلیارد)/;
    match = query.match(upToPattern);
    if (match) {
      const [, value, unit] = match;
      const multiplier = this.priceUnits[unit as keyof typeof this.priceUnits];
      return {
        max: parseFloat(value) * multiplier,
        currency: 'IRR', // Add currency
      };
    }

    // From pattern
    const fromPattern =
      /(?:از|حداقل)\s+(\d+(?:\.\d+)?)\s*(تومن|میلیون|میلیارد)/;
    match = query.match(fromPattern);
    if (match) {
      const [, value, unit] = match;
      const multiplier = this.priceUnits[unit as keyof typeof this.priceUnits];
      return {
        min: parseFloat(value) * multiplier,
        currency: 'IRR', // Add currency
      };
    }

    return undefined;
  }

  private extractArea(
    query: string
  ): { min?: number; max?: number } | undefined {
    // Pattern: "۵۰۰ متر" or "حداقل ۱۰۰ متر"
    const areaPattern = /(?:حداقل\s+)?(\d+)\s*متر/;
    const match = query.match(areaPattern);

    if (match) {
      const area = parseInt(match[1]);
      if (query.includes('حداقل')) {
        return { min: area };
      }
      return { min: area, max: area };
    }
    return undefined;
  }

  private extractFeatures(query: string): string[] {
    const features: string[] = [];

    for (const [persian, english] of Object.entries(this.features)) {
      if (query.includes(persian)) {
        features.push(english);
      }
    }

    return features;
  }
}
