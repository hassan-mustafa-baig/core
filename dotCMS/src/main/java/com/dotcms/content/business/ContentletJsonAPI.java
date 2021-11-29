package com.dotcms.content.business;

import com.dotcms.content.model.Contentlet;
import com.dotmarketing.db.DbConnectionFactory;
import com.dotmarketing.exception.DotDataException;
import com.dotmarketing.exception.DotSecurityException;
import com.dotmarketing.util.Config;
import com.fasterxml.jackson.core.JsonProcessingException;

/**
 * This is class takes care of translating a contentlet from it's regular mutable representation
 * given by @see com.dotmarketing.portlets.contentlet.model.Contentlet to json For that purpose we
 * use an intermediate representation generated via Immutables @see com.dotcms.content.model.Contentlet
 * This is based on the original logic located in @See com.dotmarketing.portlets.contentlet.transform.ContentletTransformer
 * which reads the contentlet from the columns located in the contentlet table.
 * This is meant to deal with a json representation of contentlet stored in only one column.
 */
public interface ContentletJsonAPI {

    String SAVE_CONTENTLET_AS_JSON = "persist.contentlet.as.json";

    String SAVE_CONTENTLET_AS_COLUMNS =  "persist.contentlet.as.columns";

    String CONTENTLET_AS_JSON = "contentlet_as_json";

    /**
     * Legacy Regular contentlet to json string
     * @param contentlet
     * @return
     * @throws JsonProcessingException
     * @throws DotDataException
     */
    String toJson(final com.dotmarketing.portlets.contentlet.model.Contentlet contentlet)
            throws JsonProcessingException, DotDataException;

    /**
     * Json String to Regular Contentlet
     * @param json
     * @return
     * @throws JsonProcessingException
     * @throws DotDataException
     * @throws DotSecurityException
     */
    com.dotmarketing.portlets.contentlet.model.Contentlet mapContentletFieldsFromJson(final String json)
            throws JsonProcessingException, DotDataException, DotSecurityException;


    /**
     * Json String to Immutable Contentlet
     * @param json
     * @return
     * @throws JsonProcessingException
     */
    Contentlet immutableFromJson(String json) throws JsonProcessingException;

    /**
     * This basically tells Weather or not we support saving content as json and we have not turned it off
     * @return
     */
    default boolean isPersistContentAsJson(){
        return DbConnectionFactory.isPostgres() && Config.getBooleanProperty(SAVE_CONTENTLET_AS_JSON, true);
    }

    /**
     * if we do not support content as json this has to return true
     * @return
     */
    default boolean isPersistContentletInColumns(){
        return Config.getBooleanProperty(SAVE_CONTENTLET_AS_COLUMNS, !isPersistContentAsJson());
    }

}
