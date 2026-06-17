export interface CitationSource {
  title: string;
  author?: string;
  publisher?: string;
  year?: number;
  district?: string;
  catalogReference?: string;
  pageNumber?: number;
  url: string;
}

export class CitationService {
  /**
   * Generates academic citation string based on requested style
   */
  static generateCitation(source: CitationSource, style: 'apa' | 'mla' | 'chicago' | 'ieee' = 'apa'): string {
    const author = source.author || 'Karnataka State Archives';
    const year = source.year ? String(source.year) : 'n.d.';
    const title = source.title;
    const publisher = source.publisher || 'Government of Karnataka Press';
    const catalog = source.catalogReference ? ` (Cat Ref: ${source.catalogReference})` : '';
    const page = source.pageNumber ? `, p. ${source.pageNumber}` : '';
    const dateStr = new Date().getFullYear();

    switch (style) {
      case 'apa':
        // Author, A. A. (Year). Title of work. Publisher. Retrieved from URL
        return `${author}. (${year}). ${title}${catalog}${page}. ${publisher}. Retrieved from ${source.url}`;
      case 'mla':
        // Author. Title of Work. Publisher, Year. Web. Date Accessed. URL
        return `${author}. "${title}." ${publisher}, ${year}${page}. Web. ${dateStr}. <${source.url}>.`;
      case 'chicago':
        // Author. "Title." Publisher, Year. URL.
        return `${author}. "${title}." ${publisher}, ${year}${page}. Accessed ${dateStr}. ${source.url}.`;
      case 'ieee':
        // [Index] Author, "Title," Publisher, Year. [Online]. Available: URL.
        return `${author}, "${title}${catalog}${page}," ${publisher}, ${year}. [Online]. Available: ${source.url}.`;
      default:
        return `${author}. (${year}). ${title}${catalog}${page}.`;
    }
  }
}
