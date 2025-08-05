import React from 'react';
import styled from 'styled-components';
import { Card, Button } from '@relaycore/design-system';

const BlogContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const BlogHeader = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const BlogTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const BlogDescription = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 700px;
  margin: 0 auto;
`;

const FeaturedPost = styled(Card)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 60px;
  overflow: hidden;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeaturedImage = styled.div`
  height: 100%;
  min-height: 300px;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  background-image: url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485');
  background-size: cover;
  background-position: center;
  
  @media (max-width: 768px) {
    height: 200px;
  }
`;

const FeaturedContent = styled.div`
  padding: 30px;
  display: flex;
  flex-direction: column;
`;

const PostCategory = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
  margin-bottom: 10px;
`;

const PostTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 15px;
  
  a {
    color: inherit;
    text-decoration: none;
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const PostMeta = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 15px;
`;

const PostExcerpt = styled.p`
  margin-bottom: 20px;
  line-height: 1.6;
  flex-grow: 1;
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
`;

const PostCard = styled(Card)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PostImage = styled.div`
  height: 200px;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  background-size: cover;
  background-position: center;
`;

const PostContent = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 60px;
`;

const PaginationButton = styled(Button)`
  margin: 0 5px;
`;

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  image: string;
  slug: string;
}

export const Blog: React.FC = () => {
  // Mock blog posts data
  const featuredPost: BlogPost = {
    id: '1',
    title: 'Introducing RelayCore: A Universal HTTP Relay for AI Models',
    excerpt: 'Today, we're excited to announce the launch of RelayCore, a universal HTTP relay service designed to connect your tools to any AI model with smart routing, cost optimization, and plug-and-play interoperability.',
    category: 'Announcements',
    author: 'Sarah Johnson',
    date: 'August 1, 2025',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
    slug: 'introducing-relaycore',
  };
  
  const blogPosts: BlogPost[] = [
    {
      id: '2',
      title: 'How RelayCore Saved Our Company 45% on AI Costs',
      excerpt: 'Learn how a mid-sized tech company implemented RelayCore and dramatically reduced their AI infrastructure costs while improving performance.',
      category: 'Case Studies',
      author: 'Michael Chen',
      date: 'July 28, 2025',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
      slug: 'relaycore-cost-savings-case-study',
    },
    {
      id: '3',
      title: 'Understanding Smart Routing in RelayCore',
      excerpt: 'A deep dive into how RelayCore's smart routing technology works and how it optimizes your AI requests across different providers.',
      category: 'Technical',
      author: 'Alex Rodriguez',
      date: 'July 25, 2025',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
      slug: 'understanding-smart-routing',
    },
    {
      id: '4',
      title: 'Integrating RelayCore with VS Code: A Step-by-Step Guide',
      excerpt: 'Follow this comprehensive guide to integrate RelayCore with Visual Studio Code and supercharge your development workflow.',
      category: 'Tutorials',
      author: 'Emma Wilson',
      date: 'July 22, 2025',
      image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159',
      slug: 'relaycore-vscode-integration',
    },
    {
      id: '5',
      title: 'The Future of AI Infrastructure: Trends and Predictions',
      excerpt: 'Our team analyzes current trends in AI infrastructure and makes predictions about where the industry is heading in the next few years.',
      category: 'Insights',
      author: 'David Park',
      date: 'July 18, 2025',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
      slug: 'future-of-ai-infrastructure',
    },
    {
      id: '6',
      title: 'RelayCore vs. Traditional AI Integration: A Comparison',
      excerpt: 'We compare RelayCore's approach to AI integration with traditional methods and highlight the key differences and benefits.',
      category: 'Technical',
      author: 'Sarah Johnson',
      date: 'July 15, 2025',
      image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a',
      slug: 'relaycore-vs-traditional-integration',
    },
  ];
  
  return (
    <BlogContainer>
      <BlogHeader>
        <BlogTitle>RelayCore Blog</BlogTitle>
        <BlogDescription>
          Insights, tutorials, and updates from the RelayCore team
        </BlogDescription>
      </BlogHeader>
      
      <FeaturedPost>
        <FeaturedImage style={{ backgroundImage: `url(${featuredPost.image})` }} />
        <FeaturedContent>
          <PostCategory>{featuredPost.category}</PostCategory>
          <PostTitle>
            <a href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</a>
          </PostTitle>
          <PostMeta>
            By {featuredPost.author} • {featuredPost.date}
          </PostMeta>
          <PostExcerpt>{featuredPost.excerpt}</PostExcerpt>
          <Button>Read More</Button>
        </FeaturedContent>
      </FeaturedPost>
      
      <PostGrid>
        {blogPosts.map((post) => (
          <PostCard key={post.id}>
            <PostImage style={{ backgroundImage: `url(${post.image})` }} />
            <PostContent>
              <PostCategory>{post.category}</PostCategory>
              <PostTitle>
                <a href={`/blog/${post.slug}`}>{post.title}</a>
              </PostTitle>
              <PostMeta>
                By {post.author} • {post.date}
              </PostMeta>
              <PostExcerpt>{post.excerpt}</PostExcerpt>
              <Button variant="tertiary">Read More</Button>
            </PostContent>
          </PostCard>
        ))}
      </PostGrid>
      
      <Pagination>
        <PaginationButton variant="tertiary">Previous</PaginationButton>
        <PaginationButton variant="primary">1</PaginationButton>
        <PaginationButton variant="tertiary">2</PaginationButton>
        <PaginationButton variant="tertiary">3</PaginationButton>
        <PaginationButton variant="tertiary">Next</PaginationButton>
      </Pagination>
    </BlogContainer>
  );
};