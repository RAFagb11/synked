// src/pages/SkillsAssessment.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Add this import
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const SkillsAssessment = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [userCode, setUserCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Collection of coding problems (similar to LeetCode)
  const codingProblems = {
    easy: [
      {
        id: 'e1',
        title: 'Two Sum',
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]`,
        starterCode: `function twoSum(nums, target) {
  // Your code here
  
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6));      // Expected: [1, 2]`,
        solution: `function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return null;
}`
      },
      {
        id: 'e2',
        title: 'Valid Palindrome',
        description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.
Alphanumeric characters include letters and numbers.
Given a string s, return true if it is a palindrome, or false otherwise.

Example 1:
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.

Example 2:
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.`,
        starterCode: `function isPalindrome(s) {
  // Your code here
  
}

// Test cases
console.log(isPalindrome("A man, a plan, a canal: Panama")); // Expected: true
console.log(isPalindrome("race a car"));                     // Expected: false`,
        solution: `function isPalindrome(s) {
  // Convert to lowercase and remove non-alphanumeric characters
  const cleanString = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Check if it's a palindrome
  for (let i = 0; i < Math.floor(cleanString.length / 2); i++) {
    if (cleanString[i] !== cleanString[cleanString.length - 1 - i]) {
      return false;
    }
  }
  
  return true;
}`
      }
    ],
    medium: [
      {
        id: 'm1',
        title: 'Longest Substring Without Repeating Characters',
        description: `Given a string s, find the length of the longest substring without repeating characters.

Example 1:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Example 2:
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.

Example 3:
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
Notice that the answer must be a substring, "pwke" is a subsequence and not a substring.`,
        starterCode: `function lengthOfLongestSubstring(s) {
  // Your code here
  
}

// Test cases
console.log(lengthOfLongestSubstring("abcabcbb")); // Expected: 3
console.log(lengthOfLongestSubstring("bbbbb"));    // Expected: 1
console.log(lengthOfLongestSubstring("pwwkew"));   // Expected: 3`,
        solution: `function lengthOfLongestSubstring(s) {
  let maxLength = 0;
  let start = 0;
  const charMap = new Map();
  
  for (let end = 0; end < s.length; end++) {
    const currentChar = s[end];
    
    if (charMap.has(currentChar) && charMap.get(currentChar) >= start) {
      start = charMap.get(currentChar) + 1;
    }
    
    charMap.set(currentChar, end);
    maxLength = Math.max(maxLength, end - start + 1);
  }
  
  return maxLength;
}`
      },
      {
        id: 'm2',
        title: 'Group Anagrams',
        description: `Given an array of strings strs, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

Example 1:
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]

Example 2:
Input: strs = [""]
Output: [[""]]

Example 3:
Input: strs = ["a"]
Output: [["a"]]`,
        starterCode: `function groupAnagrams(strs) {
  // Your code here
  
}

// Test cases
console.log(groupAnagrams(["eat","tea","tan","ate","nat","bat"]));
// Expected: [["bat"],["nat","tan"],["ate","eat","tea"]]
console.log(groupAnagrams([""])); // Expected: [[""]]
console.log(groupAnagrams(["a"])); // Expected: [["a"]]`,
        solution: `function groupAnagrams(strs) {
  const anagramMap = new Map();
  
  for (const str of strs) {
    // Sort the characters to get a unique key for each anagram group
    const sortedStr = str.split('').sort().join('');
    
    if (!anagramMap.has(sortedStr)) {
      anagramMap.set(sortedStr, []);
    }
    
    anagramMap.get(sortedStr).push(str);
  }
  
  return Array.from(anagramMap.values());
}`
      }
    ],
    hard: [
      {
        id: 'h1',
        title: 'Median of Two Sorted Arrays',
        description: `Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).

Example 1:
Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000
Explanation: merged array = [1,2,3] and median is 2.

Example 2:
Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.50000
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.`,
        starterCode: `function findMedianSortedArrays(nums1, nums2) {
  // Your code here
  
}

// Test cases
console.log(findMedianSortedArrays([1, 3], [2]));       // Expected: 2.0
console.log(findMedianSortedArrays([1, 2], [3, 4]));    // Expected: 2.5`,
        solution: `function findMedianSortedArrays(nums1, nums2) {
  // Ensure nums1 is the shorter array for simplicity
  if (nums1.length > nums2.length) {
    [nums1, nums2] = [nums2, nums1];
  }
  
  const m = nums1.length;
  const n = nums2.length;
  const totalLength = m + n;
  const halfLength = Math.floor((totalLength + 1) / 2);
  
  let left = 0;
  let right = m;
  
  while (left <= right) {
    const mid1 = Math.floor((left + right) / 2);
    const mid2 = halfLength - mid1;
    
    const maxLeft1 = mid1 === 0 ? -Infinity : nums1[mid1 - 1];
    const minRight1 = mid1 === m ? Infinity : nums1[mid1];
    const maxLeft2 = mid2 === 0 ? -Infinity : nums2[mid2 - 1];
    const minRight2 = mid2 === n ? Infinity : nums2[mid2];
    
    if (maxLeft1 <= minRight2 && maxLeft2 <= minRight1) {
      // Found the correct partition
      if (totalLength % 2 === 0) {
        // Even length, return average of the two middle elements
        return (Math.max(maxLeft1, maxLeft2) + Math.min(minRight1, minRight2)) / 2;
      } else {
        // Odd length, return the middle element
        return Math.max(maxLeft1, maxLeft2);
      }
    } else if (maxLeft1 > minRight2) {
      // Move left in nums1
      right = mid1 - 1;
    } else {
      // Move right in nums1
      left = mid1 + 1;
    }
  }
  
  return 0; // Should never reach here if arrays are sorted
}`
      },
      {
        id: 'h2',
        title: 'Regular Expression Matching',
        description: `Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where:
- '.' Matches any single character.
- '*' Matches zero or more of the preceding element.
The matching should cover the entire input string (not partial).

Example 1:
Input: s = "aa", p = "a"
Output: false
Explanation: "a" does not match the entire string "aa".

Example 2:
Input: s = "aa", p = "a*"
Output: true
Explanation: '*' means zero or more of the preceding element, 'a'. Therefore, by repeating 'a' once, it becomes "aa".

Example 3:
Input: s = "ab", p = ".*"
Output: true
Explanation: ".*" means "zero or more (*) of any character (.)".`,
        starterCode: `function isMatch(s, p) {
  // Your code here
  
}

// Test cases
console.log(isMatch("aa", "a"));      // Expected: false
console.log(isMatch("aa", "a*"));     // Expected: true
console.log(isMatch("ab", ".*"));     // Expected: true`,
        solution: `function isMatch(s, p) {
  const dp = Array(s.length + 1).fill().map(() => Array(p.length + 1).fill(false));
  dp[0][0] = true;
  
  // Handle patterns like a* or a*b* or a*b*c* at the beginning
  for (let j = 1; j <= p.length; j++) {
    if (p[j - 1] === '*') {
      dp[0][j] = dp[0][j - 2];
    }
  }
  
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= p.length; j++) {
      if (p[j - 1] === '*') {
        dp[i][j] = dp[i][j - 2]; // Zero occurrences
        
        if (p[j - 2] === '.' || p[j - 2] === s[i - 1]) {
          dp[i][j] = dp[i][j] || dp[i - 1][j]; // One or more occurrences
        }
      } else if (p[j - 1] === '.' || p[j - 1] === s[i - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  
  return dp[s.length][p.length];
}`
      }
    ]
  };
  
  // Select a random question when component mounts or difficulty changes
  useEffect(() => {
    const problems = codingProblems[difficulty];
    const randomIndex = Math.floor(Math.random() * problems.length);
    setSelectedQuestion(problems[randomIndex]);
    setUserCode(problems[randomIndex].starterCode);
    setOutput('');
  }, [difficulty]);
  
  // Function to run the user's code
  const runCode = () => {
    setIsRunning(true);
    setOutput('');
    
    try {
      // Create a function from the user's code
      const result = [];
      const originalConsoleLog = console.log;
      
      // Override console.log to capture output
      console.log = (...args) => {
        result.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' '));
      };
      
      // Execute the code
      // eslint-disable-next-line no-new-func
      new Function(userCode)();
      
      // Restore console.log
      console.log = originalConsoleLog;
      
      setOutput(result.join('\n'));
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Function to submit the solution
  const submitSolution = () => {
    setIsSubmitting(true);
    setOutput('Evaluating solution...');
    
    // Simulate checking solution (in a real app, this would be server-side)
    setTimeout(() => {
      try {
        // Compare with expected output (simplistic approach)
        const userSolution = userCode.replace(/\s+/g, '');
        const correctSolution = selectedQuestion.solution.replace(/\s+/g, '');
        
        if (userSolution.includes(correctSolution.substring(correctSolution.indexOf('return')))) {
          setOutput('Congratulations! Your solution passed all test cases.');
        } else {
          // Run the code to see if it works regardless
          runCode();
          setTimeout(() => {
            setOutput(prev => prev + '\n\nYour approach might be correct but differs from our solution. Please verify your test results.');
          }, 500);
        }
      } catch (error) {
        setOutput(`Error evaluating solution: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };
  
  // Generate a new question in the current difficulty
  const generateNewQuestion = () => {
    const problems = codingProblems[difficulty];
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * problems.length);
    } while (problems[randomIndex].id === selectedQuestion?.id && problems.length > 1);
    
    setSelectedQuestion(problems[randomIndex]);
    setUserCode(problems[randomIndex].starterCode);
    setOutput('');
  };

  if (!selectedQuestion) {
    return (
      <div>
        <Navigation />
        <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
          <h2>Loading skills assessment...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ padding: '80px 0' }}>
        <div className="section-header">
          <div className="feature-badge">Skills Assessment</div>
          <h2>Coding Challenge</h2>
          <p>Solve the following problem to test your programming skills</p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <label style={{ marginRight: '10px', fontWeight: '500' }}>Difficulty:</label>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ 
                padding: '8px 15px', 
                borderRadius: '8px', 
                border: '1px solid #ddd'
              }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <button 
            onClick={generateNewQuestion}
            className="btn btn-outline"
            style={{ padding: '8px 20px' }}
          >
            Generate New Question
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          marginBottom: '50px'
        }}>
          {/* Problem Description */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ marginBottom: '20px' }}>{selectedQuestion.title}</h3>
            <div style={{ 
              padding: '15px',
              backgroundColor: '#f5f7ff',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              fontFamily: 'monospace'
            }}>
              {selectedQuestion.description}
            </div>
          </div>
          
          {/* Code Editor */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
          }}>
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              style={{
                flex: 1,
                padding: '20px',
                fontFamily: 'monospace',
                fontSize: '14px',
                minHeight: '300px',
                border: 'none',
                resize: 'none',
                backgroundColor: '#282c34',
                color: '#abb2bf'
              }}
            />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '15px',
              backgroundColor: '#f5f7ff',
              borderTop: '1px solid #eee'
            }}>
              <button 
                onClick={runCode} 
                disabled={isRunning}
                className="btn btn-outline"
                style={{ padding: '8px 20px' }}
              >
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
              
              <button 
                onClick={submitSolution}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ padding: '8px 20px' }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Output Console */}
        <div style={{ 
          backgroundColor: '#282c34',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            marginBottom: '15px', 
            color: 'white',
            borderBottom: '1px solid #3e4451',
            paddingBottom: '10px'
          }}>
            Output
          </h3>
          <pre style={{ 
            color: '#abb2bf',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            minHeight: '100px'
          }}>
            {output || 'Click "Run Code" to see your code output here.'}
          </pre>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h3 style={{ marginBottom: '15px' }}>Want more practice?</h3>
          <p style={{ marginBottom: '20px' }}>
            Check out our learning resources for more coding tutorials and exercises.
          </p>
          <Link to="/learning-resources" className="btn btn-primary">
            Explore Learning Resources
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SkillsAssessment;