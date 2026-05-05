
import { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Article } from '../types';
import { formatDate } from '../lib/utils';
import { FileText, Clock, Trash2, Edit } from 'lucide-react';

interface MyContributionsProps {
  onSelectArticle: (article: Article) => void;
  onEditArticle: (article: Article) => void;
}

export default function MyContributions({ onSelectArticle, onEditArticle }: MyContributionsProps) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const path = 'articles';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${id}`);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const path = 'articles';
    const q = query(
      collection(db, path), 
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl mb-4">Please log in to see your contributions.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="border-b border-[#a2a9b1] pb-4 mb-8">
        <h1 className="font-serif text-4xl">My Contributions</h1>
        <p className="text-[#54595d] mt-2">A list of all alternate histories you have chronicled.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 animate-pulse" />)
        ) : articles.length > 0 ? (
          <table className="w-full border-collapse border border-[#a2a9b1] text-sm">
            <thead className="bg-[#f8f9fa] text-left">
              <tr>
                <th className="p-3 border border-[#a2a9b1]">Date</th>
                <th className="p-3 border border-[#a2a9b1]">Title</th>
                <th className="p-3 border border-[#a2a9b1]">Type</th>
                <th className="p-3 border border-[#a2a9b1]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="p-3 border border-[#a2a9b1] text-[#54595d] flex items-center gap-2 whitespace-nowrap">
                    <Clock className="w-3 h-3" /> {formatDate(article.createdAt)}
                  </td>
                  <td className="p-3 border border-[#a2a9b1]">
                    <button 
                      onClick={() => onSelectArticle(article)}
                      className="text-[#3366cc] hover:underline font-bold text-left"
                    >
                      {article.title}
                    </button>
                  </td>
                  <td className="p-3 border border-[#a2a9b1] capitalize italic">{article.type}</td>
                  <td className="p-3 border border-[#a2a9b1]">
                    <div className="flex gap-4 text-[#3366cc]">
                      <button 
                        onClick={() => onEditArticle(article)}
                        className="hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={(e) => handleDelete(article.id!, e)}
                        className="hover:underline flex items-center gap-1 text-[#d33] text-[11px]"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-20 bg-[#f8f9fa] border border-dashed border-[#a2a9b1] opacity-50">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p>You haven't written any articles yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
