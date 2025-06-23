// Simple test framework for validating the Quidditch League System
// This provides basic testing functionality without external dependencies

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

class SimpleTestFramework {
  private results: TestResult[] = [];

  test(name: string, testFn: () => void | boolean): void {
    try {
      const result = testFn();
      this.results.push({
        name,
        passed: result !== false,
      });
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  expect(actual: any): {
    toBe: (expected: any) => void;
    toBeGreaterThan: (expected: number) => void;
    toBeLessThanOrEqual: (expected: number) => void;
    toHaveLength: (expected: number) => void;
    toContain: (expected: any) => void;
    toBeTruthy: () => void;
    toBeFalsy: () => void;
  } {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to be ${expected}`);
        }
      },
      toBeGreaterThan: (expected: number) => {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeLessThanOrEqual: (expected: number) => {
        if (actual > expected) {
          throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
        }
      },
      toHaveLength: (expected: number) => {
        if (!actual || actual.length !== expected) {
          throw new Error(`Expected array to have length ${expected}, got ${actual?.length || 0}`);
        }
      },
      toContain: (expected: any) => {
        if (!actual || !actual.includes(expected)) {
          throw new Error(`Expected array to contain ${expected}`);
        }
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected ${actual} to be truthy`);
        }
      },
      toBeFalsy: () => {
        if (actual) {
          throw new Error(`Expected ${actual} to be falsy`);
        }
      },
    };
  }

  runTests(): void {
    console.log('🧪 Running Quidditch League System Tests...\n');
    
    let passed = 0;
    let failed = 0;

    this.results.forEach(result => {
      if (result.passed) {
        console.log(`✅ ${result.name}`);
        passed++;
      } else {
        console.log(`❌ ${result.name}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        failed++;
      }
    });

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
    
    if (failed === 0) {
      console.log('🎉 All tests passed! The Quidditch League System is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }
  }
}

// Export test functions that can be called from the browser console or main app
export function runQuidditchLeagueTests(): void {
  const test = new SimpleTestFramework();
  
  // Import services (these would be imported normally)
  let leagueManager: any;
  let teams: any[];
  let season: any;
  
  try {
    // Try to import our services
    import('../services/quidditchLeagueManager').then(({ quidditchLeagueManager }) => {
      leagueManager = quidditchLeagueManager;
      teams = leagueManager.createSampleTeams();
      
      // Test 1: Calendar generation produces correct number of matches
      test.test('Calendar generates correct number of matches', () => {
        season = leagueManager.createSeason(teams.slice(0, 4)); // Use 4 teams
        const expectedMatches = 4 * (4 - 1); // Each team plays each other twice
        test.expect(season.matches.length).toBe(expectedMatches);
      });

      // Test 2: Each team plays every other team exactly twice
      test.test('Each team plays every other team exactly twice', () => {
        const teamIds = teams.slice(0, 4).map((t: any) => t.id);
        
        for (const team1Id of teamIds) {
          for (const team2Id of teamIds) {
            if (team1Id === team2Id) continue;
            
            const matchesBetween = season.matches.filter((match: any) =>
              (match.homeTeamId === team1Id && match.awayTeamId === team2Id) ||
              (match.homeTeamId === team2Id && match.awayTeamId === team1Id)
            );
            
            test.expect(matchesBetween.length).toBe(2);
          }
        }
      });

      // Test 3: Home/away balance is correct
      test.test('Home/away balance is maintained', () => {
        const teamIds = teams.slice(0, 4).map((t: any) => t.id);
        
        for (const team1Id of teamIds) {
          for (const team2Id of teamIds) {
            if (team1Id === team2Id) continue;
            
            const homeMatches = season.matches.filter((match: any) =>
              match.homeTeamId === team1Id && match.awayTeamId === team2Id
            );
            
            const awayMatches = season.matches.filter((match: any) =>
              match.homeTeamId === team2Id && match.awayTeamId === team1Id
            );
            
            test.expect(homeMatches.length).toBe(1);
            test.expect(awayMatches.length).toBe(1);
          }
        }
      });

      // Test 4: Match simulation produces events
      test.test('Match simulation produces at least one event', () => {
        const firstMatch = season.matches[0];
        const result = leagueManager.simulateMatch(season, firstMatch.id);
        
        test.expect(result.events.length).toBeGreaterThan(0);
        test.expect(result.duration).toBeGreaterThan(0);
      });

      // Test 5: Standings calculation works
      test.test('Standings calculation works correctly', () => {
        // Simulate a few matches
        for (let i = 0; i < 3; i++) {
          const match = season.matches.find((m: any) => m.status === 'scheduled');
          if (match) {
            leagueManager.simulateMatch(season, match.id);
          }
        }
        
        const standings = leagueManager.getCurrentStandings(season);
        test.expect(standings.length).toBe(4);
        test.expect(standings[0].position).toBe(1);
      });

      // Test 6: Upcoming matches functionality
      test.test('Upcoming matches are returned correctly', () => {
        const upcoming = leagueManager.getUpcomingMatches(season, 5);
        test.expect(upcoming.length).toBeGreaterThan(0);
        test.expect(upcoming.length).toBeLessThanOrEqual(5);
        
        // Should be sorted by date
        for (let i = 1; i < upcoming.length; i++) {
          test.expect(upcoming[i].date.getTime()).toBeGreaterThan(upcoming[i-1].date.getTime());
        }
      });

      // Test 7: Season validation
      test.test('Season validation passes for correct calendar', () => {
        const validation = leagueManager.validateSeason(season);
        test.expect(validation.isValid).toBeTruthy();
        test.expect(validation.errors.length).toBe(0);
      });

      // Test 8: Simulation with odd number of teams
      test.test('Calendar works with odd number of teams', () => {
        const oddTeams = teams.slice(0, 5); // 5 teams
        const oddSeason = leagueManager.createSeason(oddTeams);
        
        const expectedMatches = 5 * (5 - 1); // Each team plays each other twice
        test.expect(oddSeason.matches.length).toBe(expectedMatches);
        
        const validation = leagueManager.validateSeason(oddSeason);
        test.expect(validation.isValid).toBeTruthy();
      });

      // Test 9: Multiple simulations produce different results
      test.test('Multiple simulations produce varied results', () => {
        const homeTeam = teams[0];
        const awayTeam = teams[1];
        
        // Create a new simulator for this test
        import('../services/quidditchSimulator').then(({ QuidditchSimulator }) => {
          const simulator = new QuidditchSimulator();
          const results = simulator.simulateMultipleMatches(homeTeam, awayTeam, 10);
          
          test.expect(results.length).toBe(10);
          
          // Check that we get some variation in scores
          const scores = results.map(r => r.homeScore + r.awayScore);
          const uniqueScores = new Set(scores);
          test.expect(uniqueScores.size).toBeGreaterThan(1); // Should have some variation
        });
      });

      // Test 10: Season progression
      test.test('Season progresses correctly through matchdays', () => {
        const testSeason = leagueManager.createSeason(teams.slice(0, 4));
        const initialMatchday = testSeason.currentMatchday;
        
        leagueManager.simulateCurrentMatchday(testSeason);
        
        test.expect(testSeason.currentMatchday).toBeGreaterThan(initialMatchday);
      });

      // Run all tests
      setTimeout(() => {
        test.runTests();
      }, 100);
    });
  } catch (error) {
    console.error('Failed to load services for testing:', error);
  }
}

// Function to run a simple performance test
export function runPerformanceTest(): void {
  console.log('🚀 Running Performance Test...\n');
  
  import('../services/quidditchLeagueManager').then(({ quidditchLeagueManager }) => {
    const startTime = performance.now();
    
    // Create a large season
    const teams = quidditchLeagueManager.createSampleTeams();
    const season = quidditchLeagueManager.createSeason(teams);
    
    console.log(`📅 Created season with ${season.matches.length} matches`);
    
    // Simulate multiple matches
    const simulationStart = performance.now();
    leagueManager.simulateCurrentMatchday(season);
    const simulationEnd = performance.now();
    
    const totalTime = performance.now() - startTime;
    const simulationTime = simulationEnd - simulationStart;
    
    console.log(`⏱️  Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`⚡ Simulation time: ${simulationTime.toFixed(2)}ms`);
    console.log(`📊 Performance: ${(season.matches.length / totalTime * 1000).toFixed(0)} matches/second generation capacity`);
  });
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).runQuidditchLeagueTests = runQuidditchLeagueTests;
  (window as any).runPerformanceTest = runPerformanceTest;
}
