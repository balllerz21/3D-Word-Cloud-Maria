export type Keyword = {
    word: string;
    weight: number;
  };
  
  export type AnalyzeResponse = {
    words?: Keyword[];
  };
  