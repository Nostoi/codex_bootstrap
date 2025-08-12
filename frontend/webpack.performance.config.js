/**
 * Performance Budget Webpack Configuration
 * Phase 3 Item 15: Performance testing with Core Web Vitals optimization
 *
 * Enforces ADHD-optimized bundle size limits and performance budgets
 */

const path = require('path');

/**
 * ADHD-optimized performance budget configuration
 * Stricter than standard budgets to ensure fast loading for users with ADHD
 */
const ADHD_PERFORMANCE_BUDGET = {
  // Bundle size limits (stricter than default)
  maxAssetSize: 400 * 1024, // 400KB instead of 500KB
  maxEntrypointSize: 400 * 1024, // 400KB
  maxChunkSize: 200 * 1024, // 200KB for individual chunks

  // Performance hints
  hints: 'error', // Fail build on budget violations

  // Asset filtering
  assetFilter: function (assetFilename) {
    // Only check JS and CSS files for size budgets
    return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
  },
};

/**
 * Performance optimization webpack configuration
 */
const performanceOptimizationConfig = {
  // Performance budget enforcement
  performance: ADHD_PERFORMANCE_BUDGET,

  // Bundle optimization
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Critical ADHD UI components - load first
        adhdUI: {
          test: /[\\/]src[\\/](components[\\/]ui|lib[\\/]accessibility)/,
          name: 'adhd-ui',
          priority: 30,
          maxSize: 150 * 1024, // 150KB limit for UI bundle
        },

        // Core performance monitoring - high priority
        performance: {
          test: /[\\/]src[\\/](lib[\\/]core-web-vitals|components[\\/]performance)/,
          name: 'performance-monitoring',
          priority: 25,
          maxSize: 100 * 1024, // 100KB limit
        },

        // React and core dependencies
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 20,
          maxSize: 200 * 1024, // 200KB limit for React
        },

        // Third-party libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          maxSize: 250 * 1024, // 250KB limit for vendor bundle
        },

        // AI and advanced features - load later
        ai: {
          test: /[\\/]src[\\/](ai|features[\\/]advanced)/,
          name: 'ai-features',
          priority: 5,
          maxSize: 200 * 1024, // 200KB limit
        },
      },
    },

    // Minimize bundle size
    usedExports: true,
    sideEffects: false,

    // Tree shaking for unused code
    providedExports: true,
  },

  // Module resolution optimization
  resolve: {
    // Alias for shorter import paths and better tree shaking
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
    },

    // Extensions for better tree shaking
    extensions: ['.ts', '.tsx', '.js', '.jsx'],

    // Prioritize ES modules for better tree shaking
    mainFields: ['module', 'main'],
  },

  // Module rules for optimization
  module: {
    rules: [
      // TypeScript/JavaScript optimization
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { modules: false }], // Preserve ES modules
                '@babel/preset-react',
                '@babel/preset-typescript',
              ],
              plugins: [
                // Bundle size optimization plugins
                '@babel/plugin-syntax-dynamic-import',
                [
                  'babel-plugin-transform-imports',
                  {
                    // Tree shake lodash imports
                    lodash: {
                      transform: 'lodash/${member}',
                      preventFullImport: true,
                    },
                  },
                ],
              ],
            },
          },
        ],
      },

      // CSS optimization
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true, // Enable CSS modules for component files
                localIdentName: '[local]_[hash:base64:5]',
              },
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'tailwindcss',
                  'autoprefixer',
                  // CSS optimization plugins
                  ['cssnano', { preset: 'default' }],
                ],
              },
            },
          },
        ],
      },
    ],
  },

  // Build analysis and reporting
  plugins: [
    // Bundle analyzer for performance monitoring (conditional)
    ...(process.env.ANALYZE === 'true'
      ? [
          new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
            analyzerMode: 'static',
            reportFilename: 'bundle-analysis.html',
            openAnalyzer: false,
          }),
        ]
      : []),

    // Performance monitoring plugin
    {
      apply: compiler => {
        compiler.hooks.done.tap('ADHDPerformanceBudgetPlugin', stats => {
          const { assets } = stats.toJson();

          // Check performance budget violations
          const violations = [];

          assets.forEach(asset => {
            if (ADHD_PERFORMANCE_BUDGET.assetFilter(asset.name)) {
              if (asset.size > ADHD_PERFORMANCE_BUDGET.maxAssetSize) {
                violations.push({
                  file: asset.name,
                  size: asset.size,
                  limit: ADHD_PERFORMANCE_BUDGET.maxAssetSize,
                  type: 'asset',
                });
              }
            }
          });

          // Report violations
          if (violations.length > 0) {
            console.log('\n🚨 ADHD Performance Budget Violations:');
            violations.forEach(violation => {
              const sizeMB = (violation.size / 1024 / 1024).toFixed(2);
              const limitMB = (violation.limit / 1024 / 1024).toFixed(2);
              console.log(`   ${violation.file}: ${sizeMB}MB (limit: ${limitMB}MB)`);
            });
            console.log(
              '\n💡 Large bundles can significantly impact ADHD users who rely on fast, predictable loading.'
            );

            if (ADHD_PERFORMANCE_BUDGET.hints === 'error') {
              throw new Error(
                'Performance budget exceeded. Build failed to protect ADHD user experience.'
              );
            }
          } else {
            console.log('\n✅ ADHD Performance Budget: All assets within limits');
          }
        });
      },
    },
  ],
};

/**
 * Development-specific optimizations
 */
const developmentOptimizations = {
  // Faster builds for development
  optimization: {
    splitChunks: {
      chunks: 'async', // Only split async chunks in development
    },
  },

  // Performance budget warnings only in development
  performance: {
    ...ADHD_PERFORMANCE_BUDGET,
    hints: 'warning', // Don't fail builds in development
  },
};

/**
 * Production-specific optimizations
 */
const productionOptimizations = {
  // Full optimization for production
  ...performanceOptimizationConfig,

  // Additional production optimizations
  optimization: {
    ...performanceOptimizationConfig.optimization,

    // Minimize for production
    minimize: true,
    minimizer: [
      new (require('terser-webpack-plugin'))({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
            drop_debugger: true,
          },
          mangle: {
            safari10: true, // Fix Safari 10 issues
          },
        },
      }),
      new (require('css-minimizer-webpack-plugin'))(),
    ],
  },
};

module.exports = {
  ADHD_PERFORMANCE_BUDGET,
  performanceOptimizationConfig,
  developmentOptimizations,
  productionOptimizations,
};
