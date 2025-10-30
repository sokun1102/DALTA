# 🏗️ Homepage Architecture Diagram

## Component Hierarchy

```
HomeScreen (Main Container)
├── Header
│   ├── Logo & Brand
│   ├── User Info
│   └── Login/Profile Button
├── SearchBar
│   ├── Search Input
│   └── Cart Icon with Badge
├── ScrollView (Main Content)
│   ├── Banner Section
│   ├── Category Tabs
│   │   ├── "Tất cả" Tab
│   │   └── Category Tabs (Dynamic)
│   └── Products Container
│       ├── Search Results (when searching)
│       ├── All Categories View (selectedCategory = "all")
│       │   └── CategorySection[] (for each category)
│       │       ├── Category Header
│       │       ├── Product Grid (max 4 items)
│       │       └── "View More" Button
│       └── Single Category View (selectedCategory = specific)
│           ├── Category Header
│           └── Product Grid (all items)
└── Bottom Navigation
```

## Data Flow

```
API Calls
├── GET /api/categories → categories state
├── GET /api/products → products state
└── Process products → productsByCategory state

User Interactions
├── Tab Selection → selectedCategory state
├── Search Input → searchText state
└── Pull to Refresh → fetchData()

State Updates
├── selectedCategory changes → re-render products
├── searchText changes → filter products
└── productsByCategory changes → update UI
```

## Component Responsibilities

### HomeScreen
- **State Management**: categories, products, productsByCategory, selectedCategory, searchText
- **Data Fetching**: API calls, data processing
- **Event Handling**: tab selection, search, refresh
- **Layout Coordination**: responsive grid, component arrangement

### Header
- **User Authentication**: login status, user info display
- **Navigation**: profile/login button handling
- **Brand Display**: logo, welcome message

### SearchBar
- **Search Input**: text input, search handling
- **Cart Display**: cart icon, item count badge
- **User Feedback**: search suggestions, cart access

### CategoryTab
- **Tab Display**: category name, active state
- **Touch Handling**: tab selection events
- **Visual Feedback**: active/inactive styling

### CategorySection
- **Product Grouping**: display products by category
- **Grid Layout**: responsive product grid
- **Navigation**: "view more" functionality
- **Product Rendering**: delegate to ProductCard

### ProductCard
- **Product Display**: name, image, price, description
- **Image Handling**: fallback images, error handling
- **Touch Events**: product selection (future)
- **Responsive Design**: adaptive sizing

## State Management Flow

```
Initial Load
├── fetchData() called
├── API calls made in parallel
├── Data processed and categorized
└── UI rendered with initial state

User Interaction: Tab Selection
├── setSelectedCategory(categoryId)
├── getFilteredProducts() recalculated
├── UI re-rendered with filtered products
└── CategorySection components updated

User Interaction: Search
├── setSearchText(searchTerm)
├── getFilteredProducts() applies search filter
├── UI switches to search results view
└── Products filtered by search criteria

User Interaction: Pull to Refresh
├── onRefresh() triggered
├── fetchData() called again
├── All states updated with fresh data
└── UI refreshed with new data
```

## Performance Optimizations

### Component Level
- **useCallback**: Event handlers to prevent unnecessary re-renders
- **Component Splitting**: Separate components for better re-render control
- **FlatList**: Efficient rendering for large product lists
- **Image Optimization**: Fallback images, error handling

### Data Level
- **Categorization**: Pre-process products by category
- **Filtering**: Efficient search and filter algorithms
- **State Structure**: Optimized state shape for fast access

### UI Level
- **Responsive Grid**: Dynamic column calculation
- **Lazy Loading**: Only render visible products
- **Pull to Refresh**: Efficient data refresh mechanism

## Future Enhancements

### Planned Features
- **Infinite Scroll**: Load more products as user scrolls
- **Product Filtering**: Filter by price, brand, rating
- **Product Sorting**: Sort by price, name, date
- **Wishlist**: Add products to favorites
- **Product Comparison**: Compare multiple products
- **Offline Support**: Cache data for offline viewing

### Technical Improvements
- **State Management**: Redux/Zustand for complex state
- **Caching**: React Query for API caching
- **Performance**: Virtual scrolling for large lists
- **Accessibility**: Screen reader support, keyboard navigation
- **Testing**: Unit tests, integration tests
- **Analytics**: User behavior tracking

## API Integration

### Current Endpoints
```
GET /api/categories
├── Returns: Array of category objects
├── Used for: Category tabs, product categorization
└── Cached: In categories state

GET /api/products
├── Returns: Array of product objects with category info
├── Used for: Product display, search, filtering
└── Processed: Into productsByCategory object
```

### Future Endpoints
```
GET /api/products?category_id=xxx
├── Returns: Products filtered by category
├── Used for: Lazy loading category products
└── Benefit: Reduced initial load time

GET /api/products/search?q=xxx
├── Returns: Search results
├── Used for: Server-side search
└── Benefit: Better search performance

GET /api/products/filters
├── Returns: Available filter options
├── Used for: Dynamic filter UI
└── Benefit: Real-time filter options
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: 2024  
**Maintainer**: AI Assistant
