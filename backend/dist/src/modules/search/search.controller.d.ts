import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(tenantId: string, query: string): Promise<import("./search.service").GlobalSearchResult>;
}
