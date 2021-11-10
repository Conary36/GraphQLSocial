const {AuthenticationError, UserInputError} = require('apollo-server');
const Post = require('../../models/Post');
const checkAuth = require('../../utility/check-auth');

module.exports = {
  Query: {
    // sayHello: () => `Hello World---Let's do some cool stuff!`
    async getPosts() {
      // Use async/await to get data from Mongo DB and prevent server from crashing
      try {
        const posts = await Post.find().sort({createdAt: -1 }); // Find all posts
        return posts;
      } catch (err) {
        console.log(err);
        throw new Error(err);
      }
    },
    async getPost(_, { postId}){
        try{
            const post = await Post.findById(postId);
            if(post){
                return post;
            }else{
                throw new Error('Post not found');
            }
        }catch(err){
            throw new Error(err);
        }
    },
  },
    Mutation: {
        async createPost(_, {body}, context){
            const user = checkAuth(context);//Check if user is authenticated then proceed if not throw error
            console.log(user);
            const newPost = new Post({
                body,
                user: user.id,
                username: user.username,
                createdAt: new Date().toISOString()
            });
            const post = await newPost.save();

            context.pubsub.publish('NEW_POST', {
              newPost: post
            })
            return post;
        },
        async deletePost(_, {postId}, context){
          const user = checkAuth(context);

          try{
            const post = await Post.findById(postId);
            if(user.username === post.username){
              await post.delete();
              return 'Post deleted successfully';
            }else{
              throw new AuthenticationError('Action not allowed');
            }
          }catch(err){
            throw new Error(err);
          }
        },
        async likePost(_, {postId}, context){
          const {username} = checkAuth(context);

          const post = await Post.findById(postId);
          if(post){
            if(post.likes.find(like => like.username === username)){
          
              //Post already liked, unliked items
              post.likes = post.likes.filter(like => like.username !== username);
              await post.save();
            }else{
              //Not liked, like the post
              post.likes.push({
                username,
                createdAt: new Date().toISOString()
              });
            }

            await post.save();
            return post;
          }else throw new UserInputError('Post not found');
        }
    },
    Subscription:{
      newPost: {
        subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('NEW_POST')
      }
    }
};
