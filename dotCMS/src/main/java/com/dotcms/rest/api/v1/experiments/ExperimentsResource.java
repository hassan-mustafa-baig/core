package com.dotcms.rest.api.v1.experiments;

import com.dotcms.experiments.business.ExperimentsAPI;
import com.dotcms.experiments.model.Experiment;
import com.dotcms.rest.InitDataObject;
import com.dotcms.rest.PATCH;
import com.dotcms.rest.WebResource;
import com.dotcms.rest.annotation.NoCache;
import com.dotcms.rest.exception.NotFoundException;
import com.dotmarketing.business.APILocator;
import com.dotmarketing.exception.DotDataException;
import com.dotmarketing.exception.DotSecurityException;
import com.liferay.portal.model.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.lang.reflect.InvocationTargetException;
import java.util.Collections;
import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import org.apache.commons.beanutils.BeanUtils;
import org.glassfish.jersey.server.JSONP;
import org.jetbrains.annotations.NotNull;

@Path("/v1/experiments")
@Tag(name = "Experiment")
public class ExperimentsResource {

    private final WebResource webResource;
    private final ExperimentsAPI experimentsAPI;

    public ExperimentsResource() {
        webResource =  new WebResource();
        experimentsAPI = APILocator.getExperimentsAPI();
    }

    @POST
    @JSONP
    @NoCache
    @Produces({MediaType.APPLICATION_JSON, "application/javascript"})
    public ResponseEntityExperimentView create(@Context final HttpServletRequest request,
            @Context final HttpServletResponse response,
            final ExperimentForm experimentForm) throws DotDataException, DotSecurityException {
        final InitDataObject initData = getInitData(request, response);

        final User user = initData.getUser();

        final Experiment experiment = createExperimentFromForm(experimentForm);

        final Experiment persistedExperiment = experimentsAPI.save(experiment, user);

        return new ResponseEntityExperimentView(Collections.singletonList(persistedExperiment));
    }

    @NotNull
    private Experiment createExperimentFromForm(ExperimentForm experimentForm) {
        return new Experiment.Builder(experimentForm.getPageId(), experimentForm.getName(),
                experimentForm.getDescription())
                .build();
    }

    @PATCH
    @Path("/{experimentId}")
    @JSONP
    @NoCache
    @Produces({MediaType.APPLICATION_JSON, "application/javascript"})
    public ResponseEntityExperimentView update(@Context final HttpServletRequest request,
            @Context final HttpServletResponse response,
            @PathParam("experimentId") final String experimentId,
            final ExperimentForm experimentForm) throws DotDataException, DotSecurityException {
        final InitDataObject initData = getInitData(request, response);
        final User user = initData.getUser();

        final Optional<Experiment> experimentToUpdate =  experimentsAPI.find(experimentId, user);

        if(experimentToUpdate.isEmpty()) {
            throw new NotFoundException("Experiment with id: " + experimentId + " not found.");
        }

        final Experiment patchedExperiment = patchExperiment(experimentToUpdate.get(), experimentForm);
        final Experiment persistedExperiment = experimentsAPI.save(patchedExperiment, user);
        return new ResponseEntityExperimentView(Collections.singletonList(persistedExperiment));
    }

    private Experiment patchExperiment(final Experiment experimentToUpdate,
            final ExperimentForm experimentForm) {

        final Experiment.Builder builder = experimentToUpdate.toBuilder();

        if(experimentForm.getName()!=null) {
            builder.name(experimentForm.getName());
        }

        if(experimentForm.getDescription()!=null) {
            builder.description(experimentForm.getDescription());
        }

        if(experimentForm.getTrafficAllocation()>0) {
            builder.trafficAllocation(experimentForm.getTrafficAllocation());
        }

        if(experimentForm.getTrafficAllocation()>0) {
            builder.trafficAllocation(experimentForm.getTrafficAllocation());
        }

        return builder.build();
    }

    private InitDataObject getInitData(@Context HttpServletRequest request,
            @Context HttpServletResponse response) {
        return new WebResource.InitBuilder(webResource)
                .requestAndResponse(request, response)
                .requiredBackendUser(true)
                .rejectWhenNoUser(true)
                .init();
    }

}
